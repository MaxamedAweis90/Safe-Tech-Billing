import React, { useState } from 'react';
import {
  MOCK_CUSTOMERS,
  MockCustomer,
  getCustomerById,
  addCustomer,
  updateCustomer,
} from '../../lib/mockData';
import { openModal, closeModal, toast } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';

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
  const existingCust = customerId ? getCustomerById(customerId) : undefined;

  const [name, setName] = useState(existingCust?.name || '');
  const [attn, setAttn] = useState(existingCust?.attn || '');
  const [phone, setPhone] = useState(existingCust?.phone || '');
  const [email, setEmail] = useState(existingCust?.email || '');
  const [taxId, setTaxId] = useState(existingCust?.taxId || '');
  const [address, setAddress] = useState(existingCust?.address || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const v = {
      name: name.trim(),
      attn: attn.trim(),
      phone: phone.trim(),
      email: email.trim(),
      taxId: taxId.trim(),
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

    if (
      MOCK_CUSTOMERS.some(
        (x) => x.id !== customerId && x.name.toLowerCase() === v.name.toLowerCase()
      )
    ) {
      setError('A customer with this name already exists.');
      return;
    }

    let rec: MockCustomer;
    if (customerId) {
      const updated = updateCustomer(customerId, v);
      if (updated) {
        rec = updated;
      } else {
        rec = addCustomer(v);
      }
    } else {
      rec = addCustomer(v);
    }

    toast(customerId ? 'Customer updated' : 'Customer added');
    onSuccess(rec);
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
        <span className="err-msg" id="cuErr">
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
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn primary" id="cuSave" onClick={handleSave}>
          {customerId ? 'Save changes' : 'Add customer'}
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

