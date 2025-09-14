"use client";

import { getImageJobsAdmin, ImageJob } from "@/actions/image-jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { columns } from "./Columns";

interface DataTableProps {
  initialData: ImageJob[];
  initialPageCount: number;
  pageSize: number;
  totalCount: number;
}

export function ImageJobsDataTable({
  initialData,
  initialPageCount,
  pageSize,
  totalCount,
}: DataTableProps) {
  const t = useTranslations("ImageJobs");

  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter] = useDebounce(globalFilter, 500);
  const [isPublicFilter, setIsPublicFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });
  const [data, setData] = useState<ImageJob[]>(initialData);
  const [pageCount, setPageCount] = useState<number>(initialPageCount);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (debouncedGlobalFilter !== undefined || isPublicFilter !== "all") {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [debouncedGlobalFilter, isPublicFilter]);

  useEffect(() => {
    if (
      pagination.pageIndex === 0 &&
      !debouncedGlobalFilter &&
      isPublicFilter === "all" &&
      data === initialData
    ) {
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getImageJobsAdmin({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          filter: debouncedGlobalFilter,
          isPublic: isPublicFilter,
        });

        if (!result.success) {
          throw new Error(result.error || t("List.failedToFetch"));
        }

        setData(result.data?.jobs || []);
        setPageCount(
          Math.ceil((result.data?.totalCount || 0) / pagination.pageSize)
        );
      } catch (error: any) {
        toast.error(t("List.failedToFetch"), {
          description: error.message,
        });
        setData([]);
        setPageCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    debouncedGlobalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    isPublicFilter,
    initialData,
  ]);

  const table = useReactTable({
    data,
    columns: columns,
    pageCount: pageCount,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    debugTable: process.env.NODE_ENV === "development",
  });

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start gap-4 py-4">
        <Input
          placeholder={t("List.searchPlaceholder")}
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <Select
          value={isPublicFilter}
          onValueChange={(value) =>
            setIsPublicFilter(value as "all" | "true" | "false")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select public status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Public</SelectItem>
            <SelectItem value="false">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border relative min-h-[200px] max-h-[calc(100vh-330px)] overflow-y-auto">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {isLoading ? "" : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} ({totalCount} Jobs)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
