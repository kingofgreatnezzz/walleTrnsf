import React from 'react';

interface PermissionRequestProps {
    onConfirm: () => void;
    onCancel: () => void;
    amount: string;
    fromWallet: string;
    toWallet: string;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({ onConfirm, onCancel, amount, fromWallet, toWallet }) => {
    return (
        <div className="permission-request">
            <h2>Permission Request</h2>
            <p>Requesting permission to transfer <strong>{amount}</strong> from <strong>{fromWallet}</strong> to <strong>{toWallet}</strong>.</p>
            <div className="button-group">
                <button onClick={onConfirm} className="confirm-button">Confirm</button>
                <button onClick={onCancel} className="cancel-button">Cancel</button>
            </div>
        </div>
    );
};

export default PermissionRequest;