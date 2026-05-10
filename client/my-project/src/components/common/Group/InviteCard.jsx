import React from 'react';
import { Check, X, Undo2, ArrowRight } from 'lucide-react';

const InviteCard = ({ invite, myInvite, onRespond, onWithdraw }) => {
  const { id, initiator, receiver, status, rejectionReason } = invite;

  console.log(initiator.department);
  const statusStyles = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
  };

  return (
    <div className="max-w-md bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 mb-4">
      {/* Header: Status Badge */}
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      {/* Body: Participant Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <p className="text-xs text-slate-400 uppercase font-medium">From</p>
          <p className="font-bold text-slate-800">{initiator.name}</p>
          <p className="text-sm text-slate-500">{initiator.department}</p>
          <p className="text-sm text-slate-500">{initiator.rollNumber}</p>
        </div>
        
        <ArrowRight className="text-slate-300" size={20} />

        <div className="flex-1 text-right">
          <p className="text-xs text-slate-400 uppercase font-medium">To</p>
          <p className="font-bold text-slate-800">{receiver.name}</p>
          <p className="text-sm text-slate-500">{receiver.department}</p>
          <p className="text-sm text-slate-500">{receiver.rollNumber}</p>
        </div>
      </div>

      {/* Conditional: Rejection Reason */}
      {status === 'rejected' && rejectionReason && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
          <p className="text-xs text-slate-600 italic">"{rejectionReason}"</p>
        </div>
      )}

      {/* Footer: Action Buttons */}
      <div className="mt-4 pt-4 border-t border-slate-50">
        {myInvite ? (
          /* Case: You received this invite */
          status === 'pending' && (
            <div className="flex gap-2">
              <button 
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                onClick={() => onRespond(id, 'Accept')}
              >
                <Check size={18} /> Accept
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 py-2 px-4 rounded-lg font-medium transition-colors"
                onClick={() => onRespond(id, 'Reject')}
              >
                <X size={18} /> Reject
              </button>
            </div>
          )
        ) : (
          /* Case: You sent this invite */
          status === 'pending' && (
            <button 
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors"
              onClick={() => onWithdraw(id)}
            >
              <Undo2 size={18} /> Withdraw Invite
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default InviteCard;