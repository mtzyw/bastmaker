"use client";

import { ImageJob } from "@/actions/image-jobs";
import { ImagePreview } from "@/components/ImagePreview";
import CopyButton from "@/components/shared/CopyButton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { featureList } from "@/config/featureList";
import { getStatusBadgeStyle } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import Image from "next/image";

export const columns: ColumnDef<ImageJob>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <div className="max-w-[200px] truncate">{row.getValue("id")}</div>
        <CopyButton text={row.getValue("id") as string} />
      </div>
    ),
  },
  {
    accessorKey: "feature_id",
    header: "Model",
    cell: ({ row }) => {
      const featureName =
        featureList[row.getValue("feature_id") as keyof typeof featureList]
          .name;
      const provider = row.original.provider;
      const providerJobId = row.original.provider_job_id;
      const providerModel = row.original.provider_model;

      return (
        <div className="max-w-[200px] truncate">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>{featureName}</TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <div>Provider: {provider}</div>
                  <div>Provider Job ID: {providerJobId}</div>
                  <div>Model: {providerModel}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
  },
  {
    accessorKey: "final_seed_used",
    header: "Seed",
    cell: ({ row }) => {
      const seed = row.getValue("final_seed_used") as number;
      return (
        <div className="flex items-center gap-1">
          <span>{seed || "-"}</span>
          {seed && <CopyButton text={seed.toString()} />}
        </div>
      );
    },
  },
  {
    accessorKey: "request_params",
    header: "Request Params",
    cell: ({ row }) => {
      const requestParams = row.getValue("request_params") as string;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="max-w-[200px] truncate">
                {JSON.stringify(requestParams)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(requestParams, null, 2)}
              </pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const errorMessage = row.original.error_message as string;
      return (
        <>
          {errorMessage ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge className={`mt-4 ${getStatusBadgeStyle(status)}`}>
                    {status}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Error: {errorMessage}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge className={`mt-4 ${getStatusBadgeStyle(status)}`}>
              {status}
            </Badge>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "is_public",
    header: "Public",
    cell: ({ row }) => {
      const isPublic = row.getValue("is_public") as boolean;
      return (
        <Badge
          className={`mt-4 ${
            isPublic
              ? "bg-blue-500 text-white dark:bg-blue-600"
              : "bg-gray-500 text-white dark:bg-gray-600"
          }`}
        >
          {isPublic ? "Public" : "Private"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "final_output_url",
    header: "Output",
    cell: ({ row }) => {
      const status = row.original.status as string;
      return status === "succeeded" ? (
        <div className="flex items-center gap-1">
          <ImagePreview>
            <Image
              src={row.getValue("final_output_url") as string}
              alt="Output"
              width={100}
              height={100}
              style={{
                objectFit: "contain",
                width: "100px",
                height: "100px",
              }}
            />
          </ImagePreview>
          <CopyButton text={row.getValue("final_output_url") as string} />
        </div>
      ) : null;
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string | Date;
      try {
        return date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-";
      } catch {
        return "-";
      }
    },
  },
];
