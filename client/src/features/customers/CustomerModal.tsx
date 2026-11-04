import React, { useState, useEffect } from 'react';
import {
  MockCustomer,
  getCustomerById,
  addCustomer,
  updateCustomer,
} from '../../lib/mockData';
import { openModal, closeModal, toast } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  useCreateCustomer,
  useUpdateCustomer,
  useCustomerDetail,
} from '../../hooks/useCustomers';

export interface CustomerModalContentProps {
  customerId?: string | null;
  onSuccess: (customer: MockCustomer) => void;
  onCancel: () => void;
}

export const CustomerModalContent: React.FC<CustomerModalContentProps> = ({
  customerId,
  onSuccess,
  onCancel,
}) => {
  const existingMock = customerId ? getCustomerById(customerId) : undefined;
  const { data: detailData } = useCustomerDetail(customerId);
  const liveCust = detailData?.data?.customer || (detailData as any)?.customer;

  const initialCust = liveCust || existingMock;

  const [name, setName] = useState(initialCust?.name || '');
  const [attn, setAttn] = useState(initialCust?.attn || '');
  const [phone, setPhone] = useState(initialCust?.phone || '');
  const [email, setEmail] = useState(initialCust?.email || '');
  const [taxId, setTaxId] = useState(initialCust?.tax_id || initialCust?.taxId || '');
  const [address, setAddress] = useState(initialCust?.address || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCust) {
      setName(initialCust.name || '');
      setAttn(initialCust.attn || '');
      setPhone(initialCust.phone || '');
      setEmail(initialCust.email || '');
      setTaxId(initialCust.tax_id || (initialCust as any).taxId || '');
      setAddress(initialCust.address || '');
    }
  }, [initialCust]);

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const handleSave = async () => {
    const v = {
      name: name.trim(),
      attn: attn.trim(),
      phone: phone.trim(),
      email: email.trim(),
      tax_id: taxId.trim(),
      address: address.trim(),
    };

    if (!v.name || !v.phone) {
      setError('Enter a name and a phone number.');
      return;
    }

    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) {
      setError("That email address doesn't look complete.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let savedCust: MockCustomer;

      if (customerId) {
        const res = await updateCustomerMutation.mutateAsync({
          id: customerId,
          data: v,
        });

        // Also update local mock data if exists
        const local = updateCustomer(customerId, { ...v, taxId: v.tax_id });
        savedCust = {
          id: res.customer._id || res.customer.id || customerId,
          code: res.customer.code || local?.code || 1000,
          name: res.customer.name,
          attn: res.customer.attn || '',
          phone: res.customer.phone || v.phone,
          email: res.customer.email || v.email,
          taxId: res.customer.tax_id || v.tax_id,
          address: res.customer.address || '',
          currency: (res.customer as any).currency || local?.currency || 'USD',
          since: res.customer.since || local?.since,
        };
      } else {
        const res = await createCustomerMutation.mutateAsync(v);
        const local = addCustomer({ ...v, taxId: v.tax_id });
        savedCust = {
          id: res.customer._id || res.customer.id || local.id,
          code: res.customer.code || local.code,
          name: res.customer.name,
          attn: res.customer.attn || '',
          phone: res.customer.phone || v.phone,
          email: res.customer.email || v.email,
          taxId: res.customer.tax_id || v.tax_id,
          address: res.customer.address || '',
          currency: (res.customer as any).currency || local.currency || 'USD',
          since: res.customer.since || local.since,
        };
      }

      onSuccess(savedCust);
    } catch (err: any) {
      const serverErr =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save customer';
      setError(serverErr);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-grid">
        <div className="field wide">
          <label htmlFor="cuName">Customer or company name *</label>
          <input
            id="cuName"
            className="inp"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="cuAttn">Attention (contact person)</label>
          <input
            id="cuAttn"
            className="inp"
            value={attn}
            onChange={(e) => setAttn(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cuPhone">Phone *</label>
          <input
            id="cuPhone"
            className="inp"
            placeholder="252 61 …"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="cuEmail">Email</label>
          <input
            id="cuEmail"
            className="inp"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="cuTax">Tax ID (optional)</label>
          <input
            id="cuTax"
            className="inp"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
          />
        </div>
        <div className="field wide">
          <label htmlFor="cuAddr">Physical address</label>
          <textarea
            id="cuAddr"
            className="inp"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <span className="err-msg" id="cuErr" style={{ display: 'block', color: 'var(--bad)', fontSize: 13 }}>
          {error}
        </span>
      )}

      <div
        className="modal-foot"
        style={{
          marginTop: 6,
          padding: '14px 0 0',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button type="button" className="btn" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <button
          type="button"
          className="btn primary"
          id="cuSave"
          onClick={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : customerId ? 'Save changes' : 'Add customer'}
        </button>
      </div>
    </div>
  );
};

export function openCustomerModal(
  customerId?: string | null,
  onSaved?: (customer: MockCustomer) => void
) {
  if (!useAuthStore.getState().can('customers')) {
    toast('Permission required: customers', true);
    return;
  }

  openModal({
    title: customerId ? 'Edit customer' : 'Add customer',
    body: (
      <CustomerModalContent
        customerId={customerId}
        onSuccess={(customer) => {
          closeModal();
          if (onSaved) onSaved(customer);
        }}
        onCancel={closeModal}
      />
    ),
  });
}
