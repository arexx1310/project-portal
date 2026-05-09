import React, { useState, useEffect, useCallback } from 'react';
import { Users, Send, Layout, PlusCircle, ShieldCheck, UserPlus, Info, AlertTriangle, X } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import groupService from '../../services/Student/groupService';

import Header from "../../components/ui/Header";
import Loader from '../../components/ui/Loader';
import { toast } from "react-hot-toast";

import ConfirmModal from "../../components/common/ConfirmModal";
import BTPPolicyCard from "../../components/common/BTPPolicyCard";
import InviteCard from '../../components/common/Group/InviteCard';

// Implementation of the Register Modal
const RegisterModal = ({ isOpen, onClose, onConfirm, invites, currentUser, loading }) => {
  if (!isOpen) return null;

  const getUniqueMembers = () => {
    const members = new Set();

    invites.forEach(inv => {
    
      members.add(inv.initiator.name);
      members.add(inv.receiver.name);
    });

    return Array.from(members);
  };

  const memberList = getUniqueMembers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Confirm Registration
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-slate-600 font-medium">The following members will be officially registered as a group:</p>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <ul className="space-y-2">
                {memberList.map((member, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700 font-semibold">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center text-[10px] text-blue-600">
                      {index + 1}
                    </div>
                    {member}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Note:</strong> If the group does not comply with BTP policies later, the group will be 
                <strong> dissolved for all members</strong> and you will have to repeat the entire process.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? "Registering..." : "Confirm & Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GroupFormationPage = () => {
  const { user, setUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [invites, setInvites] = useState([]);
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const navigate = useNavigate();

  const [modal, setModal] = useState({ 
    isOpen: false, type: '', data: null, title: '', message: '', theme: 'base' 
  });

  const initPage = useCallback(async () => {
    try {
      setLoading(true);
      const policyRes = await groupService.getBTPConfig();
      setPolicyData(policyRes.data);

      if (user?.hasGroup) {
        const groupInvitesRes = await groupService.getGroupInvites();
        setInvites(groupInvitesRes.data || []);
      } else {
        const myInvitesRes = await groupService.getMyInvites();
        setInvites(myInvitesRes.data || []);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to sync data.");
    } finally {
      setLoading(false);
    }
  }, [user?.hasGroup]);

  useEffect(() => {
    initPage();
  }, [initPage]);

  const isValidGroupName = (name) => {
    const regex = /^[a-zA-Z0-9@_#\-\s]{3,}$/;
    return regex.test(name);
  };

  const handleRegisterInitiation = () => {
    // Check if there are any pending invites
    const hasPendingInvites = invites.some(inv => inv.status.toLowerCase() !== 'accepted');
    
    if (hasPendingInvites) {
      toast.error("All invites must be 'Accepted' before registration. Withdraw pending invites if needed.", {
        duration: 5000,
        icon: '⚠️'
      });
      return;
    }

    if (invites.length === 0) {
        toast.error("You cannot register a group alone. Please invite members.");
        return;
    }

    setIsRegisterModalOpen(true);
  };

  const handleRegisterConfirm = async () => {
    setActionLoading(true);
    try {
      await groupService.registerGroup();
      toast.success("Group Registered Successfully!");
      setIsRegisterModalOpen(false);
      navigate("/student/profile"); 
    } catch (error) {
      toast.error(error?.message || "Registration Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const triggerConfirm = (type, data = null) => {
    const configs = {
      CREATE: { title: "Establish Group", message: `Create group "${groupName}"?`, theme: "base", action: "Create Group" },
      ACCEPT: { title: "Accept Invitation", message: "Join this group? This cannot be undone.", theme: "green", action: "Join Group" },
      REJECT: { title: "Reject Invitation", message: "Decline this request?", theme: "red", action: "Decline" },
      WITHDRAW: { title: "Withdraw Invite", message: "Remove this pending invitation?", theme: "red", action: "Withdraw" }
    };

    setModal({ isOpen: true, type, data, ...configs[type] });
  };

  const handleExecuteAction = async () => {
    setActionLoading(true);
    try {
      let successMsg = "";
      switch (modal.type) {
        case 'CREATE':
          await groupService.createGroup(groupName);
          const { data: userData } = await axiosInstance.get(API_PATHS.AUTH.ME);
          setUser(userData.user);
          successMsg = "Group created!";
          break;
        case 'ACCEPT':
          await groupService.respondToInvite(modal.data, 'Accept');
          const { data: refreshData } = await axiosInstance.get(API_PATHS.AUTH.ME);
          setUser(refreshData.user);
          setInvites([]);
          successMsg = "Joined group!";
          break;
        case 'REJECT':
          await groupService.respondToInvite(modal.data, 'Reject');
          successMsg = "Declined.";
          break;
        case 'WITHDRAW':
          await groupService.withdrawInvite(modal.data);
          successMsg = "Withdrawn.";
          break;
      }
      toast.success(successMsg);
      setModal({ ...modal, isOpen: false });
      initPage();
    } catch (err) {
      toast.error(err?.message || "Action failed");
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
      initPage();
    } catch (err) {
      toast.error(err?.message || "Failed to send invite");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Header 
            title="Group Formation" 
            subtitle={user?.hasGroup ? "Manage your team" : "Create or join a team"} 
            icon={user?.hasGroup ? Users : Layout} 
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Header 
            title="Group Formation" 
            subtitle={user?.hasGroup ? "Manage your team" : "Create or join a team"} 
            icon={user?.hasGroup ? Users : Layout} 
          />
          {user?.hasGroup && (
            <button
              onClick={handleRegisterInitiation}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 uppercase text-xs tracking-wider"
            >
            <ShieldCheck className="w-4 h-4" />
              Register Final Group
            </button>
          )}
        </div>

        <BTPPolicyCard data={policyData} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-8">
            {!user?.hasGroup ? (
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
            ) : (
              <section className="bg-white p-8 rounded-[2.5rem] border-2 border-emerald-100">
                <div className="flex items-center gap-3 mb-6">
                  <UserPlus className="text-emerald-600" size={22} />
                  <h2 className="text-xl font-black uppercase tracking-tight">Invite Peer</h2>
                </div>
                <form onSubmit={handleSendInvite} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Roll Number..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!rollNumber || actionLoading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Send Invitation
                  </button>
                </form>
              </section>
            )}

            {!user?.hasGroup && (
              <section>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Pending for You</h2>
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
                  ) : <p className="text-slate-400 italic text-center p-8 border border-dashed rounded-[2rem]">No invites yet.</p>}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-7">
            {user?.hasGroup ? (
              <section>
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Group Members & Invites</h2>
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
                  ) : <p className="text-slate-400 p-10 text-center col-span-2">No outgoing invites.</p>}
                </div>
              </section>
            ) : (
              <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <h3 className="text-2xl font-black mb-4">Collaboration Hub</h3>
                <p className="text-indigo-100 opacity-80 mb-8">You are currently independent. Create a group or check your "Pending" list to join teammates.</p>
                <div className="flex items-center gap-4 text-sm font-bold bg-indigo-950/50 p-4 rounded-2xl">
                  <Info size={20} /> Note: Group limits are subject to BTP Policy.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={handleExecuteAction}
        title={modal.title}
        message={modal.message}
        theme={modal.theme}
        loading={actionLoading}
      >
        {modal.action}
      </ConfirmModal>

      <RegisterModal 
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onConfirm={handleRegisterConfirm}
        invites={invites}
        currentUser={user}
        loading={actionLoading}
      />
    </div>
  );
};

export default GroupFormationPage;