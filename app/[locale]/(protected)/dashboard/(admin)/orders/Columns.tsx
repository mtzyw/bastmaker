"use client";

import CopyButton from "@/components/shared/CopyButton";
import { Badge } from "@/components/ui/badge";
import { OrderWithUser } from "@/types/admin/orders";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";

export const columns: ColumnDef<OrderWithUser>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <div className="max-w-[150px] truncate">{row.getValue("id")}</div>
        <CopyButton text={row.getValue("id") as string} />
      </div>
    ),
  },
  {
    accessorKey: "users",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.users;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{user?.full_name}</span>
          <span className="text-muted-foreground flex items-center gap-1">
            {user?.email} <CopyButton text={user?.email || ""} />
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "provider",
    header: "Provider",
    cell: ({ row }) => {
      return <span className="font-mono">{row.original.provider}</span>;
    },
  },
  {
    accessorKey: "provider_order_id",
    header: "Provider Order ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <div className="max-w-[150px] truncate">
          {row.getValue("provider_order_id")}
        </div>
        <CopyButton text={row.getValue("id") as string} />
      </div>
    ),
  },
  {
    accessorKey: "amount_total",
    header: "Amount",
    cell: ({ row }) => (
      <div className="flex flex-col w-[120px]">
        <span>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: row.original.currency,
          }).format(row.original.amount_total)}
        </span>
        {row.original.amount_discount ? (
          <span className="text-xs text-muted-foreground">
            Discount:{" "}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: row.original.currency,
            }).format(row.original.amount_discount)}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "order_type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.order_type}</Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "secondary" | "destructive" | "outline" = "outline";
      if (status === "succeeded" || status === "active") {
        variant = "secondary";
      } else if (
        status === "failed" ||
        status === "canceled" ||
        status === "past_due"
      ) {
        variant = "destructive";
      }
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string | Date;
      try {
        return date ? (
          <div className="w-[180px]">
            {dayjs(date).format("YYYY-MM-DD HH:mm:ss")}
          </div>
        ) : (
          "-"
        );
      } catch {
        return "-";
      }
    },
  },
];
