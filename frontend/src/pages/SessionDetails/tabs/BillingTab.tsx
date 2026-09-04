import React from 'react';
import { DollarSign, Users, RotateCcw, Search, TrendingUp, TrendingDown, Wallet, Check, X, Edit2, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils';

export const BillingTab = ({
  billingAttendances, totalIncome, totalExpense, netBalance, defaultFee, setDefaultFee,
  memberDefaultFee, setMemberDefaultFee, billingSearch, setBillingSearch, editingPaymentId,
  setEditingPaymentId, editPaymentValue, setEditPaymentValue, isProcessing, handleOpenImportModal,
  handleUpdateDefaultFee, handleResetBilling, savePaymentAmount, handleStatusChange, expenses,
  expenseForm, setExpenseForm, handleAddExpense, handleDeleteExpense, t, inputStyles
}: any) => {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="flex flex-col gap-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-ink uppercase tracking-wider">{t('total_income', 'Total Income')}</p>
              <p className="text-xl font-bold text-primary dark:text-primary-dark">{formatCurrency(totalIncome)}</p>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-ink uppercase tracking-wider">{t('total_expense', 'Total Expense')}</p>
              <p className="text-xl font-bold text-primary dark:text-primary-dark">{formatCurrency(totalExpense)}</p>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${netBalance >= 0 ? 'bg-accent-soft dark:bg-accent-soft-dark text-ink dark:text-ink-dark' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-ink uppercase tracking-wider">{t('net_balance', 'Net Balance')}</p>
              <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-ink dark:text-ink-dark' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Income Section */}
          <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <div className="flex items-center gap-3">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <DollarSign size={18} className="text-emerald-500"/> {t('player_payments', 'Player Payments')}
                </h3>
                <button onClick={handleOpenImportModal} disabled={isProcessing} className="flex items-center gap-2 bg-surface dark:bg-elevated-dark border border-subtle dark:border-strong-dark text-primary dark:text-primary-dark hover:bg-app dark:hover:bg-strong-dark px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
                  <Users size={14} /> <span className="hidden sm:inline">{t('import_members', 'Import Members')}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-surface dark:bg-elevated-dark border border-subtle dark:border-strong-dark p-1 rounded-lg">
                  <input type="number" value={defaultFee || ''} onChange={(e) => setDefaultFee(parseInt(e.target.value) || 0)} className="w-20 sm:w-24 bg-transparent outline-none text-right font-bold text-sm px-2 text-primary dark:text-primary-dark" placeholder={String(t('walk_in_fee', { defaultValue: 'Walk-in' }))}/>
                  <div className="w-px h-5 bg-muted dark:bg-strong-dark"></div>
                  <input type="number" value={memberDefaultFee || ''} onChange={(e) => setMemberDefaultFee(parseInt(e.target.value) || 0)} className="w-20 sm:w-24 bg-transparent outline-none text-right font-bold text-sm px-2 text-primary dark:text-primary-dark" placeholder={String(t('member_fee', { defaultValue: 'Member' }))}/>
                </div>
                <button onClick={handleUpdateDefaultFee} disabled={isProcessing} className="bg-ink hover:bg-ink-soft text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50">
                  {t('set_fee', 'Set Fee')}
                </button>
                <button onClick={handleResetBilling} disabled={isProcessing} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/30 rounded-lg transition-colors ml-1 disabled:opacity-50" title={String(t('reset_billing', { defaultValue: 'Reset All Payments' }))}>
                  <RotateCcw size={16}/>
                </button>
              </div>
            </div>

            <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-surface dark:bg-surface-dark">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={16} />
                <input type="text" placeholder={String(t('search_players', { defaultValue: 'Search players...' }))} value={billingSearch} onChange={(e) => setBillingSearch(e.target.value)} className={`${inputStyles} pl-9`} />
              </div>
            </div>
            
            <div className="hidden sm:block overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-ink uppercase bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark">
                  <tr>
                    <th className="px-4 py-3">{t('player', 'Player')}</th>
                    <th className="px-4 py-3 text-right">{t('amount', 'Amount')}</th>
                    <th className="px-4 py-3 w-40">{t('status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {billingAttendances.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-ink">No players found</td></tr>}
                  {billingAttendances.map(({ member, attendance }: any) => (
                    <tr key={attendance.id} className="hover:bg-app dark:hover:bg-elevated-dark/50 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {member.name}
                        {attendance.status === 'absent' && <span className="ml-2 text-[9px] font-bold tracking-widest uppercase text-faint border border-subtle dark:border-default-dark px-1.5 py-0.5 rounded bg-app dark:bg-app-dark">{t('absent', 'Absent')}</span>}
                      </td>
                      <td className="px-4 py-3 min-w-[120px] text-right">
                        {editingPaymentId === attendance.id ? (
                          <div className="flex items-center justify-end gap-2 w-full">
                            <input 
                              type="number" 
                              autoFocus
                              value={editPaymentValue || ''} 
                              onChange={(e) => setEditPaymentValue(parseInt(e.target.value) || 0)}
                              className="w-24 px-2 py-1 bg-surface dark:bg-surface-dark border border-ink rounded text-right font-bold outline-none"
                              onKeyDown={(e) => { if (e.key === 'Enter') savePaymentAmount(attendance.id, attendance.paymentStatus || 'unpaid'); }}
                            />
                            <button onClick={() => savePaymentAmount(attendance.id, attendance.paymentStatus || 'unpaid')} className="p-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded"><Check size={14}/></button>
                            <button onClick={() => setEditingPaymentId(null)} className="p-1 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded"><X size={14}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2 group cursor-pointer w-full" onClick={() => { setEditingPaymentId(attendance.id); setEditPaymentValue(attendance.paymentAmount || 0); }}>
                            <span className="font-bold">{formatCurrency(attendance.paymentAmount || 0)}</span>
                            <Edit2 size={12} className="text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select 
                          value={attendance.paymentStatus || 'unpaid'}
                          onChange={(e) => handleStatusChange(attendance, e.target.value)}
                          className={`w-full px-2 py-1.5 rounded outline-none border font-bold text-xs uppercase tracking-wider cursor-pointer ${
                            (attendance.paymentStatus || 'unpaid') === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' :
                            (attendance.paymentStatus || 'unpaid') === 'member' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' :
                            (attendance.paymentStatus || 'unpaid') === 'member_unpaid' ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 dark:text-fuchsia-400' :
                            (attendance.paymentStatus || 'unpaid') === 'free' ? 'bg-accent-soft border-accent text-ink dark:bg-accent-soft-dark dark:border-strong-dark dark:text-ink-dark' :
                            'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                          }`}
                        >
                          <option value="unpaid">{t('unpaid', 'Unpaid')}</option>
                          <option value="paid">{t('paid', 'Paid')}</option>
                          <option value="member">{t('member', 'Member')}</option>
                          <option value="member_unpaid">{t('member_unpaid', 'Member (Unpaid)')}</option>
                          <option value="free">{t('free', 'Free')}</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden flex flex-col p-4 gap-3 bg-app dark:bg-app-dark flex-1">
              {billingAttendances.map(({ member, attendance }: any) => (
                <div key={attendance.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-bold text-sm dark:text-primary-dark truncate">{member.name}</span>
                      {attendance.status === 'absent' && <span className="text-[9px] font-bold tracking-widest uppercase text-faint border border-subtle dark:border-default-dark px-1 py-0.5 rounded bg-app dark:bg-app-dark shrink-0">{t('absent', 'Absent')}</span>}
                    </div>
                    <select 
                      value={attendance.paymentStatus || 'unpaid'}
                      onChange={(e) => handleStatusChange(attendance, e.target.value)}
                      className={`px-2 py-1 rounded outline-none border font-bold text-[10px] uppercase tracking-wider shrink-0 cursor-pointer ${
                        (attendance.paymentStatus || 'unpaid') === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' :
                        (attendance.paymentStatus || 'unpaid') === 'member' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' :
                        (attendance.paymentStatus || 'unpaid') === 'member_unpaid' ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 dark:text-fuchsia-400' :
                        (attendance.paymentStatus || 'unpaid') === 'free' ? 'bg-accent-soft border-accent text-ink dark:bg-accent-soft-dark dark:border-strong-dark dark:text-ink-dark' :
                        'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                      }`}
                    >
                      <option value="unpaid">{t('unpaid', 'Unpaid')}</option>
                      <option value="paid">{t('paid', 'Paid')}</option>
                      <option value="member">{t('member', 'Member')}</option>
                      <option value="member_unpaid">{t('member_unpaid', 'Member (Unpaid)')}</option>
                      <option value="free">{t('free', 'Free')}</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs text-muted-ink font-bold uppercase tracking-widest">{t('amount', 'Amount')}</span>
                    {editingPaymentId === attendance.id ? (
                      <div className="flex items-center justify-end gap-2 w-full">
                        <input 
                          type="number" 
                          autoFocus
                          value={editPaymentValue || ''} 
                          onChange={(e) => setEditPaymentValue(parseInt(e.target.value) || 0)}
                          className="w-full max-w-[100px] px-2 py-1.5 bg-surface dark:bg-app-dark border border-ink rounded text-right font-bold outline-none"
                        />
                        <button onClick={() => savePaymentAmount(attendance.id, attendance.paymentStatus || 'unpaid')} className="p-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 rounded"><Check size={16}/></button>
                        <button onClick={() => setEditingPaymentId(null)} className="p-1.5 text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 rounded"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => { setEditingPaymentId(attendance.id); setEditPaymentValue(attendance.paymentAmount || 0); }}>
                        <span className="font-bold">{formatCurrency(attendance.paymentAmount || 0)}</span>
                        <Edit2 size={14} className="text-ink" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Section */}
          <div className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark rounded-2xl shadow-sm overflow-hidden flex flex-col h-max">
            <div className="p-4 border-b border-subtle dark:border-subtle-dark bg-app dark:bg-app-dark">
              <h3 className="font-bold flex items-center gap-2"><DollarSign size={18} className="text-rose-500"/> {t('expenses', 'Expenses')}</h3>
            </div>
            
            <div className="p-4 border-b border-subtle dark:border-subtle-dark">
              <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder={String(t('description', { defaultValue: 'Description (e.g., Shuttlecocks)' }))} 
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className={`${inputStyles} flex-1`}
                  required
                  disabled={isProcessing}
                />
                <input 
                  type="number" 
                  placeholder={String(t('amount', { defaultValue: 'Amount' }))} 
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className={`${inputStyles} sm:w-32 text-right`}
                  required
                  disabled={isProcessing}
                />
                <button disabled={isProcessing} type="submit" className="bg-ink dark:bg-muted text-white dark:text-primary hover:bg-elevated dark:hover:bg-surface px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50">
                  <Plus size={16} /> <span className="sm:hidden lg:inline">{t('add_expense', 'Add Expense')}</span>
                </button>
              </form>
            </div>

            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-ink uppercase bg-app dark:bg-app-dark border-b border-subtle dark:border-subtle-dark">
                  <tr>
                    <th className="px-4 py-3">{t('description', 'Description')}</th>
                    <th className="px-4 py-3 text-right">{t('amount', 'Amount')}</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E293B]">
                  {expenses.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-ink font-medium">No expenses recorded.</td></tr>
                  )}
                  {expenses.map((expense: any) => (
                    <tr key={expense.id} className="hover:bg-app dark:hover:bg-elevated-dark/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{expense.description}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button disabled={isProcessing} onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 text-faint hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-colors disabled:opacity-50">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden flex flex-col gap-3 p-4 bg-app dark:bg-app-dark">
              {expenses.map((expense: any) => (
                <div key={expense.id} className="bg-surface dark:bg-surface-dark border border-subtle dark:border-subtle-dark p-4 rounded-xl shadow-sm flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm dark:text-primary-dark">{expense.description}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold mt-1">{formatCurrency(expense.amount)}</span>
                  </div>
                  <button disabled={isProcessing} onClick={() => handleDeleteExpense(expense.id)} className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors disabled:opacity-50"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};  