"use client";

import { Icon } from "./Icon";
import { HousekeepingStatus, HousekeepingTask } from "@/lib/mockData";
import { cn, dateFromOffset, formatMonthDay, housekeepingStatusStyles } from "@/lib/utils";

const COLUMNS: HousekeepingStatus[] = ["Dirty", "Cleaning", "Inspection", "Ready", "Maintenance"];

function actionsFor(status: HousekeepingStatus): { label: string; next: HousekeepingStatus; icon: "sparkles" | "check" | "wrench" | "history" }[] {
  switch (status) {
    case "Dirty":
      return [
        { label: "Start Cleaning", next: "Cleaning", icon: "sparkles" },
        { label: "Flag Maintenance", next: "Maintenance", icon: "wrench" },
      ];
    case "Cleaning":
    case "Inspection":
      return [
        { label: "Mark Ready", next: "Ready", icon: "check" },
        { label: "Flag Maintenance", next: "Maintenance", icon: "wrench" },
      ];
    case "Ready":
      return [{ label: "Flag Maintenance", next: "Maintenance", icon: "wrench" }];
    case "Maintenance":
      return [{ label: "Return to Queue", next: "Dirty", icon: "history" }];
  }
}

export function HousekeepingBoard({
  tasks,
  onUpdateTask,
  notify,
}: {
  tasks: HousekeepingTask[];
  onUpdateTask: (taskId: string, patch: Partial<HousekeepingTask>) => void;
  notify: (message: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl2 border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-cream/70">
        Housekeeping needs a simple mobile-friendly workflow so front desk and cleaning staff can stay aligned.
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-2 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-[minmax(240px,1fr)] lg:grid-cols-none">
        {COLUMNS.map((column) => {
          const styles = housekeepingStatusStyles[column];
          const columnTasks = tasks.filter((t) => t.status === column);
          return (
            <div key={column} className="flex min-w-0 flex-col rounded-xl2 border border-white/5 bg-navy/50 shadow-card">
              <div className={cn("flex items-center justify-between rounded-t-xl2 border-b px-3 py-2.5", styles.bg, styles.border)}>
                <span className={cn("text-xs font-semibold uppercase tracking-wide", styles.text)}>{column}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-cream/70">
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 p-3">
                {columnTasks.length === 0 && (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-xs text-cream/35">
                    Nothing here right now.
                  </p>
                )}
                {columnTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-white/10 bg-deep-navy/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-cream">{task.roomNumber}</p>
                        <p className="text-[11px] text-cream/45">{task.roomType}</p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-cream/55">
                      <p>Last checkout: {task.lastCheckoutOffset === 0 ? "Today" : formatMonthDay(dateFromOffset(task.lastCheckoutOffset))}</p>
                      <p>
                        Next arrival:{" "}
                        {task.nextArrivalOffset === null
                          ? "—"
                          : task.nextArrivalOffset === 0
                          ? "Today"
                          : formatMonthDay(dateFromOffset(task.nextArrivalOffset))}
                      </p>
                    </div>
                    {task.notes && <p className="mt-2 text-xs leading-relaxed text-cream/60">{task.notes}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {actionsFor(task.status).map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            onUpdateTask(task.id, { status: action.next });
                            notify(`${task.roomNumber} moved to ${action.next}.`);
                          }}
                          className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-cream/80 ring-1 ring-white/10 transition hover:bg-white/10"
                        >
                          <Icon name={action.icon} className="h-3 w-3" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
