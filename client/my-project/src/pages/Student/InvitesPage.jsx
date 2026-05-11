import React, { useState, useEffect, useCallback } from 'react';
import { Users, Layout, PlusCircle, ShieldCheck, UserPlus, AlertTriangle, X, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import groupService from '../../services/Student/groupService';

import Header from "../../components/ui/Header";
import Loader from '../../components/ui/Loader';
import { toast } from "react-hot-toast";

import ConfirmModal from "../../components/common/ConfirmModal";
import BTPPolicyCard from "../../components/common/BTPPolicyCard";
import InviteCard from '../../components/common/Group/InviteCard';
import GroupDetails from '../../components/common/Group/GroupDetails';


/* ─────────────────────────────────────────────────────────────────────────────
   FINALIZE GROUP MODAL
   Shows current members from groupDetails.members and warns about irreversibility.
───────────────────────────────────────────────────────────────────────────── */
const FinalizeModal = ({ isOpen, onClose, onConfirm, members = [], loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Finalize Group
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-slate-600 font-medium">
              The following members will be officially registered as a group:
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <ul className="space-y-2">
                {members.map((member, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center text-[10px] text-blue-600 shrink-0">
                      {index + 1}
                    </div>
                    <span>{member.name}</span>
                    <span className="text-xs text-slate-400 font-mono ml-auto">{member.rollNumber}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>This action is irreversible.</strong> Once finalized, the group will be
                officially formed and no further members can be added unless a faculty member does so.
                If the group does not comply with BTP policies, it will be{' '}
                <strong>dissolved for all members</strong> and you will have to repeat the entire process.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? "Finalizing..." : "Confirm & Finalize"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
const GroupFormationPage = () => {
  const navigate = useNavigate();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [groupDetails, setGroupDetails] = useState(undefined); // undefined = not yet loaded, null = no group
  const [invites, setInvites] = useState([]);
  const [policyData, setPolicyData] = useState(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [modal, setModal] = useState({
    isOpen: false, type: '', data: null, title: '', message: '', theme: 'base'
  });


  // ── Derived state ────────────────────────────────────────────────────────────
  const hasGroup   = groupDetails !== null && groupDetails !== undefined;
  const isDraft    = hasGroup && groupDetails?.status?.toLowerCase() === 'draft';
  const isFormed   = hasGroup && groupDetails?.status?.toLowerCase() === 'formed';


  // ── Data fetching ────────────────────────────────────────────────────────────

  /**
   * Fetches everything needed for the page.
   * groupDetails === null  → student has no group
   * groupDetails !== null  → student belongs to a group
   */
  const fetchGroupDetails = useCallback(async () => {
    const res = await groupService.getGroupDetails();
    setGroupDetails(res.data); // null if no group
    return res.data;
  }, []);

  const fetchInvites = useCallback(async (currentGroup) => {
    if (currentGroup) {
      // Student has a group — show outgoing group invites
      const res = await groupService.getGroupInvites();
      setInvites(res.data || []);
    } else {
      // Student has no group — show invites sent to them
      const res = await groupService.getMyInvites();
      setInvites(res.data || []);
    }
  }, []);

  const initPage = useCallback(async () => {
    try {
      setLoading(true);
      const [policyRes, groupRes] = await Promise.all([
        groupService.getBTPConfig(),
        groupService.getGroupDetails(),
      ]);

      setPolicyData(policyRes.data);
      const group = groupRes.data;
      setGroupDetails(group);

      await fetchInvites(group);
    } catch (err) {
      toast.error(err?.message || "Failed to load page data.");
    } finally {
      setLoading(false);
    }
  }, [fetchInvites]);

  useEffect(() => {
    initPage();
  }, [initPage]);


  // ── Validation ───────────────────────────────────────────────────────────────
  const isValidGroupName = (name) => /^[a-zA-Z0-9@_#\-\s]{3,}$/.test(name);


  // ── Action handlers ──────────────────────────────────────────────────────────

  const triggerConfirm = (type, data = null) => {
    const configs = {
      CREATE:  { title: "Establish Group",    message: `Create group "${groupName}"?`,       theme: "base", action: "Create Group" },
      ACCEPT:  { title: "Accept Invitation",  message: "Join this group? This cannot be undone.", theme: "green", action: "Join Group" },
      REJECT:  { title: "Reject Invitation",  message: "Decline this invite?",               theme: "red",  action: "Decline"     },
      WITHDRAW:{ title: "Withdraw Invite",    message: "Remove this pending invitation?",    theme: "red",  action: "Withdraw"    },
    };
    setModal({ isOpen: true, type, data, ...configs[type] });
  };

  const handleExecuteAction = async () => {
    setActionLoading(true);
    try {
      let successMsg = "";

      switch (modal.type) {

        case 'CREATE': {
          await groupService.createGroup(groupName);
          // Backend refreshes cookie — re-fetch group details so UI reflects new group
          const newGroup = await fetchGroupDetails();
          await fetchInvites(newGroup);
          setGroupName('');
          successMsg = "Group created!";
          break;
        }

        case 'ACCEPT': {
          const res = await groupService.respondToInvite(modal.data, 'Accept');
          // Backend refreshes cookie — re-fetch group details to get the joined group
          const newGroup = await fetchGroupDetails();
          await fetchInvites(newGroup);
          successMsg = res.message || "Invite accepted. You have joined the group.";
          break;
        }

        case 'REJECT': {
          await groupService.respondToInvite(modal.data, 'Reject');
          await fetchInvites(null); // still no group
          successMsg = "Invite declined.";
          break;
        }

        case 'WITHDRAW': {
          await groupService.withdrawInvite(modal.data);
          await fetchInvites(groupDetails);
          successMsg = "Invite withdrawn.";
          break;
        }
      }

      toast.success(successMsg);
      setModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      toast.error(err?.message || "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!rollNumber) return;
    setActionLoading(true);
    try {
      await groupService.sendInvite({ rollNumber });
      toast.success(`Invite sent to ${rollNumber}`);
      setRollNumber('');
      await fetchInvites(groupDetails);
    } catch (err) {
      toast.error(err?.message || "Failed to send invite.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizeInitiation = () => {
    const hasPendingInvites = invites.some(inv => inv.status?.toLowerCase() === 'pending');
    if (hasPendingInvites) {
      toast.error("Withdraw all pending invites before finalizing the group.", {
        duration: 5000, icon: '⚠️',
      });
      return;
    }
    setIsFinalizeModalOpen(true);
  };

  const handleFinalizeConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await groupService.registerGroup();
      toast.success("Group finalized successfully!");
      setIsFinalizeModalOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed Registration", { duration: 7000 });
    } finally {
      const updatedGroup = await fetchGroupDetails();
      await fetchInvites(updatedGroup);
      setIsFinalizeModalOpen(false);
      setActionLoading(false);
    }
  };


  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading || groupDetails === undefined) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-20">
        <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
          <Header title="Group Formation" subtitle="Loading..." icon={Layout} />
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Header
            title="Group Formation"
            subtitle={hasGroup ? `${groupDetails.name} · ${groupDetails.status}` : "Create or join a team"}
            icon={hasGroup ? Users : Layout}
          />

          {/* Finalize button — only when Draft */}
          {isDraft && (
            <button
              onClick={handleFinalizeInitiation}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 uppercase text-xs tracking-wider disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              Finalize Group
            </button>
          )}
        </div>


        {/* ════════════════════════════════════════════════════════════════
            BRANCH A — Student has NO group
            Show: create form + invites sent to them
        ════════════════════════════════════════════════════════════════ */}
        {!hasGroup && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Create Group form */}
            <div className="lg:col-span-5 space-y-8">
              <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <PlusCircle className="text-indigo-600" size={24} />
                  <h2 className="text-xl font-black uppercase tracking-tight">New Group</h2>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Group Name (@, _, # allowed)"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                  <button
                    onClick={() => triggerConfirm('CREATE')}
                    disabled={!isValidGroupName(groupName) || actionLoading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Establish Group
                  </button>
                </div>
              </section>

              {/* Invites pending for this student */}
              <section>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                  Pending for You
                </h2>
                <div className="space-y-4">
                  {invites.length > 0 ? (
                    invites.map(inv => (
                      <InviteCard
                        key={inv.id}
                        invite={inv}
                        myInvite={true}
                        onRespond={(id, action) => triggerConfirm(action.toUpperCase(), id)}
                      />
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-center p-8 border border-dashed rounded-[2rem]">
                      No invites yet.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Info panel */}
            <div className="lg:col-span-7">
              <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <h3 className="text-2xl font-black mb-4">Collaboration Hub</h3>
                <p className="text-indigo-100 opacity-80 mb-8">
                  You are currently independent. Create a group or check your "Pending" list to join teammates.
                </p>
                <div className="flex items-center gap-4 text-sm font-bold bg-indigo-950/50 p-4 rounded-2xl">
                  <Info size={20} /> Group limits are subject to BTP Policy.
                </div>
              </div>
            </div>

          </div>
        )}


        {/* ════════════════════════════════════════════════════════════════
            BRANCH B — Student HAS a group in DRAFT status
            Show: BTP policy card → group details → send invite → group invites
        ════════════════════════════════════════════════════════════════ */}
        {isDraft && (
          <>
            {/* BTP Policy card */}
            <BTPPolicyCard data={policyData} />

            {/* Group Details component */}
            <GroupDetails group={groupDetails} />
              <div className="max-w-4xl mx-auto space-y-10">
                
                {/* Send Invite form - Centered Section */}
                <section className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100 shadow-sm">
                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                      <UserPlus className="text-emerald-600" size={24} />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Invite a Peer</h2>
                    <p className="text-sm text-slate-500 font-medium">Add members to your group using their roll number</p>
                  </div>

                  <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter Roll Number..."
                      className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!rollNumber || actionLoading}
                      className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200/50"
                    >
                      {actionLoading ? "Sending..." : "Send Invite"}
                    </button>
                  </form>
                </section>

                {/* Group Invites Section - Matching Width */}
                <section>
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                      Outgoing Invitations
                    </h2>
                    <div className="h-px flex-1 bg-slate-200"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invites.length > 0 ? (
                      invites.map(inv => (
                        <InviteCard
                          key={inv.id}
                          invite={inv}
                          myInvite={false}
                          onWithdraw={(id) => triggerConfirm('WITHDRAW', id)}
                        />
                      ))
                    ) : (
                      <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Info className="text-slate-400" size={20} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No pending requests</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
          </>
        )}


        {/* ════════════════════════════════════════════════════════════════
            BRANCH C — Student HAS a group NOT in Draft (Formed / Active / etc.)
            Show: group details + group invites (read-only)
        ════════════════════════════════════════════════════════════════ */}
      {hasGroup && !isDraft && (
        <div className="space-y-10">
          {/* Group Details component - full width or nested as per your design */}
          <GroupDetails group={groupDetails} />

          {/* Centered Read-Only Invites Section */}
          <div className="max-w-4xl mx-auto">
            <section>
              <div className="flex items-center gap-3 mb-6 px-2">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  Group Invite History
                </h2>
                <div className="h-px flex-1 bg-slate-200/60"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invites.length > 0 ? (
                  invites.map(inv => (
                    <InviteCard
                      key={inv.id}
                      invite={inv}
                      myInvite={false}
                      // Read-only state: no onWithdraw provided
                    />
                  ))
                ) : (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/30">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                      <Info className="text-slate-300" size={20} />
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      No invite history.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      </div>


      {/* ── Shared Confirm Modal (Create / Accept / Reject / Withdraw) ──────── */}
      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteAction}
        title={modal.title}
        message={modal.message}
        theme={modal.theme}
        loading={actionLoading}
      >
        {modal.action}
      </ConfirmModal>


      {/* ── Finalize Group Modal ─────────────────────────────────────────────── */}
      <FinalizeModal
        isOpen={isFinalizeModalOpen}
        onClose={() => setIsFinalizeModalOpen(false)}
        onConfirm={handleFinalizeConfirm}
        members={groupDetails?.members || []}
        loading={actionLoading}
      />

    </div>
  );
};

export default GroupFormationPage;