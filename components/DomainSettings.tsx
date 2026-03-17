import React, { useState } from 'react';
import { Globe, CheckCircle2, XCircle, Copy, ExternalLink, ShieldCheck, Mail, Key } from 'lucide-react';
import { motion } from 'motion/react';

interface DNSRecord {
  id: string;
  type: 'CNAME';
  name: string;
  value: string;
  status: 'verified' | 'unverified';
  category: 'Frontend API' | 'Account portal' | 'Email';
}

const INITIAL_RECORDS: DNSRecord[] = [
  {
    id: '1',
    type: 'CNAME',
    name: 'clerk',
    value: 'frontend-api.clerk.services',
    status: 'unverified',
    category: 'Frontend API'
  },
  {
    id: '2',
    type: 'CNAME',
    name: 'accounts',
    value: 'accounts.clerk.services',
    status: 'unverified',
    category: 'Account portal'
  },
  {
    id: '3',
    type: 'CNAME',
    name: 'clkmail',
    value: 'mail.33km59lq1ck1.clerk.services',
    status: 'unverified',
    category: 'Email'
  },
  {
    id: '4',
    type: 'CNAME',
    name: 'clk._domainkey',
    value: 'dkim1.33km59lq1ck1.clerk.services',
    status: 'unverified',
    category: 'Email'
  },
  {
    id: '5',
    type: 'CNAME',
    name: 'clk2._domainkey',
    value: 'dkim2.33km59lq1ck1.clerk.services',
    status: 'unverified',
    category: 'Email'
  }
];

export function DomainSettings() {
  const [records, setRecords] = useState<DNSRecord[]>(INITIAL_RECORDS);
  const [isVerifying, setIsVerifying] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    
    const updatedRecords = await Promise.all(records.map(async (record) => {
      try {
        const domain = `${record.name}.impersio.me`;
        const response = await fetch(`/api/dns/verify?domain=${domain}&expected=${record.value}`);
        const data = await response.json();
        return { ...record, status: data.verified ? 'verified' : 'unverified' as const };
      } catch (error) {
        console.error(`Error verifying ${record.name}:`, error);
        return record;
      }
    }));

    setRecords(updatedRecords);
    setIsVerifying(false);
  };

  const verifySingle = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'unverified' } : r));
    
    try {
      const domain = `${record.name}.impersio.me`;
      const response = await fetch(`/api/dns/verify?domain=${domain}&expected=${record.value}`);
      const data = await response.json();
      setRecords(prev => prev.map(r => r.id === id ? { ...r, status: data.verified ? 'verified' : 'unverified' as const } : r));
    } catch (error) {
      console.error(`Error verifying ${record.name}:`, error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f9fafb] dark:bg-[#0a0a0a] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Domain Configuration</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Configure your DNS records to enable Clerk authentication on <span className="font-mono text-foreground">impersio.me</span>
          </p>
        </header>

        <div className="grid gap-6">
          {/* Status Summary */}
          <div className="bg-white dark:bg-[#111] border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Setup Status</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                Action Required
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#111] flex items-center justify-center text-[10px] font-bold ${i <= 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                0 of 5 records verified. SSL certificates will be issued once all records are configured.
              </p>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-[#111] border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
              <h2 className="text-sm font-medium">DNS Records</h2>
              <button 
                onClick={handleVerify}
                disabled={isVerifying}
                className="text-xs font-medium bg-foreground text-background px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify All'}
              </button>
            </div>
            
            <div className="divide-y divide-border">
              {records.map((record) => (
                <motion.div 
                  key={record.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-muted-foreground">
                          {record.type}
                        </span>
                        <span className="text-sm font-medium">{record.category}</span>
                        {record.status === 'verified' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <CircleDashed className="w-4 h-4 text-amber-500 animate-spin-slow" />
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground break-all">
                        {record.name}.impersio.me
                      </div>
                    </div>

                    <div className="flex-1 max-w-md">
                      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-border">
                        <code className="text-xs font-mono truncate mr-2">{record.value}</code>
                        <button 
                          onClick={() => copyToClipboard(record.value)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-muted-foreground"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => verifySingle(record.id)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors text-muted-foreground"
                        title="Verify this record"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded ${
                        record.status === 'verified' 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                SSL Certificates
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Certificates for the Frontend API and Account Portal will be issued automatically once DNS records are verified. This usually takes 5-10 minutes.
              </p>
            </div>
            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-xl">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-purple-500" />
                Email Deliverability
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The DKIM records (clk._domainkey) are essential for ensuring your emails don't end up in spam. Make sure to add both records.
              </p>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-sm font-medium text-red-500 mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Danger Zone
            </h2>
            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium mb-1">Change Domain</h3>
                <p className="text-xs text-muted-foreground">
                  Changing the domain will result in downtime and require new DNS configuration.
                </p>
              </div>
              <button className="px-4 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">
                Change Domain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
