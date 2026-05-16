"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { History, Search } from "lucide-react";
import type { AuditLogListItem } from "@/server/actions/users";

interface AuditLogTableProps {
  logs: AuditLogListItem[];
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionBadge(
  action: string
): "success" | "destructive" | "warning" | "info" | "secondary" {
  if (action.includes("APPROVED") || action.includes("ACTIVATED"))
    return "success";
  if (action.includes("REJECTED") || action.includes("SUSPENDED"))
    return "destructive";
  if (action.includes("ROLE")) return "warning";
  return "info";
}

export function AuditLogTable(
  props: AuditLogTableProps
): React.ReactElement {
  const { logs } = props;
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const entities = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => s.add(l.entity));
    return Array.from(s).sort();
  }, [logs]);

  const actions = useMemo(() => {
    const s = new Set<string>();
    logs.forEach((l) => s.add(l.action));
    return Array.from(s).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (entityFilter !== "ALL" && l.entity !== entityFilter) return false;
      if (actionFilter !== "ALL" && l.action !== actionFilter) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        l.entityId.toLowerCase().includes(q) ||
        (l.userName ?? "").toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q)
      );
    });
  }, [logs, search, entityFilter, actionFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-sm min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#736B66]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, entity, user..."
            className="pl-9 bg-white border-[#E8E0D5]"
          />
        </div>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px] bg-white border-[#E8E0D5]">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All entities</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px] bg-white border-[#E8E0D5]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-[#E8E0D5]">
          <History className="mx-auto h-10 w-10 text-[#D4A574] mb-2" />
          <p className="text-sm text-[#736B66]">ไม่มี audit log ที่ตรงกับ filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F0E8]">
                <TableHead className="text-[#2D2825]">Timestamp</TableHead>
                <TableHead className="text-[#2D2825]">Actor</TableHead>
                <TableHead className="text-[#2D2825]">Action</TableHead>
                <TableHead className="text-[#2D2825]">Entity</TableHead>
                <TableHead className="text-[#2D2825]">Entity ID</TableHead>
                <TableHead className="text-[#2D2825]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow
                  key={l.id}
                  className="hover:bg-[#F5F0E8]/40 transition-colors"
                >
                  <TableCell className="text-xs text-[#736B66] whitespace-nowrap">
                    {formatDate(l.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {l.userName ?? "—"}
                    <div className="text-xs text-[#736B66]">{l.userEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionBadge(l.action)}>{l.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#2D2825]">
                    {l.entity}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-[#736B66]">
                    {l.entityId.substring(0, 10)}…
                  </TableCell>
                  <TableCell className="text-xs text-[#736B66] max-w-[280px] truncate">
                    {l.details
                      ? JSON.stringify(l.details)
                      : <span className="text-[#D4A574]">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
