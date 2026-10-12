import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { 
  AdminStats, 
  AdminMemberRow, 
  QuestionRubric, 
  AuditLogItem 
} from '../types';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  SlidersHorizontal,
  FileSpreadsheet, 
  Eye, 
  Edit3, 
  ShieldAlert, 
  History, 
  BookOpen, 
  AlertTriangle,
  Save,
  CheckCircle2,
  X,
  RefreshCw,
  Award,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'members' | 'rubrics' | 'audit' | 'branding'>('members');
  
  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [members, setMembers] = useState<AdminMemberRow[]>([]);
  const [rubrics, setRubrics] = useState<QuestionRubric[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  
  // Logo upload state
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState<string | null>(null);
  const [activeLogoUrl, setActiveLogoUrl] = useState('/lfg-original-logo.jpg');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [attemptFilter, setAttemptFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected Member for Modal
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Score Override in Modal
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [newScoreVal, setNewScoreVal] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  // Rubric Editing
  const [editingRubricQNum, setEditingRubricQNum] = useState<number | null>(null);
  const [rubricDraftText, setRubricDraftText] = useState<string>('');
  const [rubricSaving, setRubricSaving] = useState(false);
  const [rubricSuccess, setRubricSuccess] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await apiRequest<AdminStats>('/api/admin/stats');
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams({
        timeFilter,
        attemptFilter,
        resultFilter,
        search: searchQuery,
        sortBy,
      });
      const data = await apiRequest<{ members: AdminMemberRow[] }>(`/api/admin/members?${params.toString()}`);
      setMembers(data.members || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load member records');
    } finally {
      setLoading(false);
    }
  };

  const fetchRubrics = async () => {
    try {
      const data = await apiRequest<{ questions: QuestionRubric[] }>('/api/admin/rubrics');
      setRubrics(data.questions || []);
    } catch (err: any) {
      console.error('Error fetching rubrics:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await apiRequest<{ logs: AuditLogItem[] }>('/api/admin/audit-logs');
      setAuditLogs(data.logs || []);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRubrics();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [timeFilter, attemptFilter, resultFilter, sortBy]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  // Open member detail modal
  const openMemberDetail = async (memberId: string) => {
    setSelectedMemberId(memberId);
    setLoadingDetail(true);
    setOverrideSuccess(null);
    setEditingAnswerId(null);
    try {
      const data = await apiRequest(`/api/admin/members/${memberId}`);
      setMemberDetail(data);
    } catch (err: any) {
      alert('Could not fetch candidate answers: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Admin Score Override
  const handleScoreOverrideSubmit = async (answerId: string) => {
    if (!overrideReason.trim()) {
      alert('Please enter a mandatory administrative reason for overriding the score.');
      return;
    }
    setOverrideLoading(true);
    setOverrideSuccess(null);

    try {
      const data = await apiRequest('/api/admin/override-score', {
        method: 'POST',
        body: JSON.stringify({
          answerId,
          newScore: newScoreVal,
          reason: overrideReason.trim(),
        }),
      });

      setOverrideSuccess('Score successfully modified and recorded in system audit logs.');
      setEditingAnswerId(null);
      setOverrideReason('');

      // Refresh detail
      if (selectedMemberId) {
        const refreshed = await apiRequest(`/api/admin/members/${selectedMemberId}`);
        setMemberDetail(refreshed);
      }
      fetchStats();
      fetchMembers();
    } catch (err: any) {
      alert('Error overriding score: ' + err.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  // Save Rubric
  const handleSaveRubric = async (qNum: number) => {
    if (!rubricDraftText.trim()) return;
    setRubricSaving(true);
    setRubricSuccess(null);

    try {
      await apiRequest(`/api/admin/rubrics/${qNum}`, {
        method: 'PUT',
        body: JSON.stringify({
          rubric: rubricDraftText.trim(),
          isApproved: true,
        }),
      });

      setRubricSuccess(`Rubric for Question ${qNum} has been updated and approved.`);
      setEditingRubricQNum(null);
      fetchRubrics();
    } catch (err: any) {
      alert('Failed to update rubric: ' + err.message);
    } finally {
      setRubricSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploadLoading(true);
    setLogoUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await apiRequest('/api/admin/upload-logo', {
          method: 'POST',
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name,
          }),
        });
        setLogoUploadSuccess(`Original logo "${file.name}" uploaded successfully! It is now the active logo across all pages.`);
        setActiveLogoUrl(`/lfg-original-logo.jpg?t=${Date.now()}`);
        fetchAuditLogs();
      } catch (err: any) {
        alert('Failed to upload logo: ' + err.message);
      } finally {
        setLogoUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-[#0b2545] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Authorized Administrator Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Legend Flow Global Central Review
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Real-time candidate submissions, AI evaluation logs, rubric review, and audit trail.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/20 self-start md:self-auto flex-wrap gap-1">
          <button
            onClick={() => { setActiveTab('members'); fetchMembers(); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'members'
                ? 'bg-white text-[#0b2545] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members & Results</span>
          </button>
          <button
            onClick={() => { setActiveTab('rubrics'); fetchRubrics(); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'rubrics'
                ? 'bg-white text-[#0b2545] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Evaluation Rubrics</span>
          </button>
          <button
            onClick={() => { setActiveTab('branding'); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-white text-[#0b2545] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Logo & Branding</span>
          </button>
          <button
            onClick={() => { setActiveTab('audit'); fetchAuditLogs(); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-[#0b2545] shadow-xs'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* 6 Summary Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Total Registered</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats.totalRegisteredMembers}</span>
            <span className="text-[10px] text-slate-400">Total verified members</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Attempted</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{stats.membersAttempted}</span>
            <span className="text-[10px] text-slate-400">Interviews submitted</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Not Attempted</span>
            <span className="text-2xl font-black text-slate-500 mt-1 block">{stats.membersNotAttempted}</span>
            <span className="text-[10px] text-slate-400">Awaiting candidate start</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Passed (≥7/10)</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.membersPassed}</span>
            <span className="text-[10px] text-slate-400">Qualified candidates</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Failed (&lt;7/10)</span>
            <span className="text-2xl font-black text-rose-600 mt-1 block">{stats.membersFailed}</span>
            <span className="text-[10px] text-slate-400">Below pass threshold</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Pending Eval</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.pendingEvaluations}</span>
            <span className="text-[10px] text-slate-400">In queue or review</span>
          </div>
        </div>
      )}

      {/* TAB 1: MEMBERS TABLE */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          {/* Filters & Search Header */}
          <div className="p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or sponsor ID..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </form>

              {/* Refresh Button */}
              <button
                onClick={() => { fetchStats(); fetchMembers(); }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 self-start lg:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Data</span>
              </button>
            </div>

            {/* Filter controls row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Time Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Timeframe</label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                </select>
              </div>

              {/* Attempt Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Attempt Status</label>
                <select
                  value={attemptFilter}
                  onChange={(e) => setAttemptFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="all">All Candidates</option>
                  <option value="attempted">Attempted</option>
                  <option value="not_attempted">Not Attempted</option>
                </select>
              </div>

              {/* Result Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Interview Result</label>
                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="all">All Results</option>
                  <option value="pass">PASS (≥ 7)</option>
                  <option value="fail">FAIL (&lt; 7)</option>
                  <option value="pending">Pending Evaluation</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 bg-white font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Candidate Name (A-Z)</option>
                  <option value="highest_score">Highest Score</option>
                  <option value="lowest_score">Lowest Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Member Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Sponsor / Senior</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Passed Qs</th>
                  <th className="py-3.5 px-4">Final Result</th>
                  <th className="py-3.5 px-4">Submission Time</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      <span className="inline-block animate-spin mr-2">⟳</span>
                      Loading records...
                    </td>
                  </tr>
                )}
                {!loading && members.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No members match the selected filters or search query.
                    </td>
                  </tr>
                )}
                {!loading &&
                  members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{m.fullName}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">{m.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {m.sponsorId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(m.registeredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {m.hasAttempted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Attempted
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Not Attempted
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {m.passedQuestions !== null ? `${m.passedQuestions} / 10` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {m.isPassed === true && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            PASS ({m.totalScore}%)
                          </span>
                        )}
                        {m.isPassed === false && m.evaluationStatus === 'completed' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800">
                            FAIL ({m.totalScore}%)
                          </span>
                        )}
                        {m.evaluationStatus === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pending Eval
                          </span>
                        )}
                        {!m.hasAttempted && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {m.submissionTime ? new Date(m.submissionTime).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openMemberDetail(m.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0b2545] text-white hover:bg-[#133968] transition-all cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RUBRIC MANAGEMENT */}
      {activeTab === 'rubrics' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Official 10-Question Evaluation Rubrics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These rubrics instruct the AI Evaluation Engine how candidate answers are judged.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Questions 1 &amp; 3 require admin presentation/business alignment</span>
            </div>
          </div>

          {rubricSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{rubricSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            {rubrics.map((r) => {
              const isEditing = editingRubricQNum === r.question_number;
              return (
                <div
                  key={r.question_number}
                  className={`p-5 rounded-2xl border transition-all ${
                    r.requires_custom_review
                      ? 'bg-amber-50/30 border-amber-300'
                      : 'bg-slate-50/60 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                          Question {r.question_number} of 10
                        </span>
                        {r.requires_custom_review && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded-full">
                            Requires Presentation Alignment
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900">{r.text_english}</p>
                      <p className="text-xs text-slate-600 font-urdu dir-rtl text-right" dir="rtl">
                        {r.text_urdu}
                      </p>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingRubricQNum(r.question_number);
                          setRubricDraftText(r.admin_approved_rubric || r.default_rubric);
                          setRubricSuccess(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit Rubric</span>
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-3 bg-white p-4 rounded-xl border border-slate-300">
                      <label className="block text-xs font-bold text-slate-700">
                        Edit Official Evaluation Criteria:
                      </label>
                      <textarea
                        rows={4}
                        value={rubricDraftText}
                        onChange={(e) => setRubricDraftText(e.target.value)}
                        className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setEditingRubricQNum(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={rubricSaving}
                          onClick={() => handleSaveRubric(r.question_number)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{rubricSaving ? 'Saving...' : 'Save & Approve Rubric'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-1">Approved Evaluation Rubric:</span>
                      <p className="leading-relaxed">{r.admin_approved_rubric || r.default_rubric}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Administrative Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable log of all score overrides, rubric modifications, and administrative operations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Type</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Details / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No administrative actions logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{log.admin_email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">{log.target_type}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.target_id}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {log.details ? JSON.stringify(log.details) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LOGO & BRANDING */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Legend Flow Global — Logo &amp; Brand Assets</h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage the official LFG logo. Upload the original high-resolution graphic (IMG-20261005-WA0080.jpg) to apply it across all pages.
            </p>
          </div>

          {logoUploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{logoUploadSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Active Logo Card */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Active Logo Preview
              </span>
              <div className="w-44 h-44 mx-auto flex items-center justify-center p-2 rounded-full bg-white shadow-md border border-slate-200">
                <img
                  src={activeLogoUrl}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/lfg-logo.svg')) {
                      target.src = '/lfg-logo.svg';
                    }
                  }}
                  alt="Active LFG Logo"
                  className="w-full h-full object-contain aspect-square"
                />
              </div>
              <p className="text-xs text-slate-500">
                1:1 aspect ratio strictly preserved. Proportions unclipped and undistorted.
              </p>
            </div>

            {/* Upload Original File Card */}
            <div className="p-6 rounded-2xl bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors space-y-4">
              <div className="flex items-center space-x-3 text-blue-950">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Upload Original Logo File</h3>
                  <p className="text-xs text-slate-500">Select IMG-20261005-WA0080.jpg or any image file</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                When you select your original file, it is saved directly to <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/public/lfg-original-logo.jpg</code> and immediately updates across the homepage, navbar, member portal, and interview screens.
              </p>

              <div>
                <label className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-[#0b2545] hover:bg-[#133968] text-white text-xs font-bold cursor-pointer transition-all shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>{logoUploadLoading ? 'Uploading Logo...' : 'Select Original Logo Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={logoUploadLoading}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DETAIL MODAL */}
      {selectedMemberId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#0b2545] p-6 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold">
                  {memberDetail?.member?.fullName || 'Candidate Record'}
                </h3>
                <span className="text-xs text-blue-200">
                  {memberDetail?.member?.email} • Sponsor: {memberDetail?.member?.sponsorId}
                </span>
              </div>
              <button
                onClick={() => setSelectedMemberId(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {loadingDetail && (
                <div className="py-12 text-center text-slate-400">
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Loading detailed candidate submission...
                </div>
              )}

              {!loadingDetail && !memberDetail?.attempt && (
                <div className="py-12 text-center text-slate-500">
                  <p className="text-sm font-semibold">This candidate has not attempted the interview yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Their profile was registered on {new Date(memberDetail?.member?.registeredAt).toLocaleDateString()}.</p>
                </div>
              )}

              {!loadingDetail && memberDetail?.attempt && (
                <div className="space-y-6">
                  {/* Attempt Summary Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Overall Result</span>
                      <span
                        className={`text-lg font-black ${
                          memberDetail.attempt.isPassed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {memberDetail.attempt.isPassed ? 'PASS' : 'FAIL'} ({memberDetail.attempt.passedQuestions}/10 Passed)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Average Score</span>
                      <span className="text-lg font-black text-slate-900">
                        {memberDetail.attempt.totalScore}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Submission Date</span>
                      <span className="text-xs font-medium text-slate-700">
                        {new Date(memberDetail.attempt.submissionTime).toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">System Dispatch</span>
                      <span className="text-xs font-semibold text-emerald-700">Database Recorded</span>
                    </div>
                  </div>

                  {overrideSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{overrideSuccess}</span>
                    </div>
                  )}

                  {/* 10 Candidate Answers with Score Override */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Candidate's 10 Submitted Answers &amp; AI Analysis
                    </h4>

                    {memberDetail.attempt.answers.map((ans: any) => {
                      const isEditingScore = editingAnswerId === ans.id;

                      return (
                        <div
                          key={ans.questionNumber}
                          className={`p-4 rounded-2xl border transition-all ${
                            ans.isPassed ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-xs font-extrabold uppercase text-slate-500">
                                Question {ans.questionNumber} of 10
                              </span>
                              <p className="text-xs font-bold text-slate-900">{ans.questionTextEn}</p>
                              <p className="text-[11px] text-slate-600 font-urdu dir-rtl text-right" dir="rtl">
                                {ans.questionTextUr}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span
                                className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                  ans.isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {ans.score}% • {ans.isPassed ? 'PASS' : 'FAIL'}
                              </span>

                              {!isEditingScore && (
                                <button
                                  onClick={() => {
                                    setEditingAnswerId(ans.id);
                                    setNewScoreVal(ans.score);
                                    setOverrideReason('');
                                    setOverrideSuccess(null);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Admin Override Score"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Candidate Answer */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200 mb-2">
                            <span className="text-[10px] font-bold text-slate-500 block mb-0.5 uppercase">
                              Candidate Answer:
                            </span>
                            <p className="text-xs text-slate-800 whitespace-pre-wrap">{ans.answerText}</p>
                          </div>

                          {/* AI Rationale & Feedback */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 block">AI Rationale:</span>
                              <span className="text-slate-600">{ans.explanation}</span>
                            </div>
                            <div className="p-2.5 bg-white/80 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-700 block">Feedback:</span>
                              <span className="text-slate-600">{ans.feedback}</span>
                            </div>
                          </div>

                          {/* Admin Score Override Box */}
                          {isEditingScore && (
                            <div className="mt-3 p-3 bg-white rounded-xl border-2 border-blue-300 space-y-2">
                              <span className="text-xs font-bold text-blue-900 block">
                                Override Question {ans.questionNumber} Score (Requires Audit Reason):
                              </span>
                              <div className="flex items-center space-x-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 block">New Score (0-100)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={newScoreVal}
                                    onChange={(e) => setNewScoreVal(Number(e.target.value))}
                                    className="w-24 px-2 py-1 text-xs border rounded-lg"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-500 block">
                                    Administrative Justification / Reason <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    placeholder="e.g. Candidate gave strong oral answer in Urdu verified by senior"
                                    className="w-full px-2 py-1 text-xs border rounded-lg"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2 pt-1">
                                <button
                                  onClick={() => setEditingAnswerId(null)}
                                  className="px-2.5 py-1 text-xs rounded border text-slate-600 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  disabled={overrideLoading}
                                  onClick={() => handleScoreOverrideSubmit(ans.id)}
                                  className="px-3 py-1 text-xs font-bold rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  {overrideLoading ? 'Updating...' : 'Save & Log Override'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
