"use client";

import { Activity, Clock, Server, User } from "lucide-react";
import type { Account, Rules } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface HeaderProps {
  account: Account;
  rules: Rules;
  generatedAt: number;
}

export function Header({ account, rules, generatedAt }: HeaderProps) {
  return (
    <header className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Prop Firm Dashboard
            </h1>
            <p className="text-xs text-zinc-500">
              {rules.firm} · {rules.phase}
            </p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-white/10 md:block" />

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <User className="h-4 w-4" />
            <span className="font-mono text-zinc-200">{account.login}</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <Server className="h-4 w-4" />
            <span className="text-zinc-200">{account.server}</span>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-xs font-medium text-zinc-300">
            {account.currency}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="h-3.5 w-3.5" />
        <span>Snapshot: {formatDate(generatedAt)}</span>
      </div>
    </header>
  );
}
