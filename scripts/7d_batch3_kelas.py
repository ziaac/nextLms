import os, textwrap

files = {}

# ============================================================
# 1. src/app/dashboard/kelas/page.tsx
# ============================================================
files["src/app/dashboard/kelas/page.tsx"] = textwrap.dedent("""\
    "use client";

    import { useState, useCallback } from "react";
    import { useRouter } from "next/navigation";
    import { PageHeader } from "@/components/ui/PageHeader";
    import { Button } from "@/components/ui/Button";
    import { ConfirmModal } from "@/components/ui/ConfirmModal";
    import { Plus } from "lucide-react";
    import { KelasFilters } from "./_components/KelasFilters";
    import { KelasTable } from "./_components/KelasTable";
    import { KelasFormModal } from "./_components/KelasFormModal";
    import { KelasDetailPanel } from "./_components/KelasDetailPanel";
    import { useKelasList, useDeleteKelas } from "@/hooks/kelas/useKelas";
    import type { Kelas, KelasFilterParams } from "@/types/kelas.types";

    export default function KelasPage() {
      const router = useRouter();

      // ── Filter state ──────────────────────────────────────────────────────────
      const [filters, setFilters] = useState<KelasFilterParams>({});

      // ── Modal/panel state ─────────────────────────────────────────────────────
      const [formOpen, setFormOpen] = useState(false);
      const [editTarget, setEditTarget] = useState<Kelas | null>(null);
      const [detailTarget, setDetailTarget] = useState<Kelas | null>(null);
      const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null);

      // ── Data ──────────────────────────────────────────────────────────────────
      const { data, isLoading, isError } = useKelasList(filters);
      const kelasList = data?.data ?? [];

      // ── Delete mutation ───────────────────────────────────────────────────────
      const deleteMutation = useDeleteKelas(deleteTarget?.id ?? "");

      // ── Handlers ──────────────────────────────────────────────────────────────
      const handleOpenCreate = useCallback(() => {
        setEditTarget(null);
        setFormOpen(true);
      }, []);

      const handleOpenEdit = useCallback((kelas: Kelas) => {
        setEditTarget(kelas);
        setFormOpen(true);
        setDetailTarget(null);
      }, []);

      const handleRowClick = useCallback((kelas: Kelas) => {
        setDetailTarget(kelas);
      }, []);

      const handleNavigateSiswa = useCallback(
        (kelasId: string) => {
          router.push(`/dashboard/kelas/${kelasId}/siswa`);
        },
        [router]
      );

      const handleConfirmDelete = useCallback(() => {
        if (!deleteTarget) return;
        deleteMutation.mutate(undefined, {
          onSuccess: () => {
            setDeleteTarget(null);
            if (detailTarget?.id === deleteTarget.id) setDetailTarget(null);
          },
        });
      }, [deleteTarget, deleteMutation, detailTarget]);

      return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <PageHeader
            title="Master Kelas"
            description="Kelola data kelas seluruh tahun ajaran"
          >
            <Button
              onClick={handleOpenCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kelas</span>
            </Button>
          </PageHeader>

          <KelasFilters filters={filters} onChange={setFilters} />

          <KelasTable
            data={kelasList}
            isLoading={isLoading}
            isError={isError}
            onRowClick={handleRowClick}
            onEdit={handleOpenEdit}
            onDelete={(kelas) => setDeleteTarget(kelas)}
            onNavigateSiswa={handleNavigateSiswa}
            activeId={detailTarget?.id}
          />

          {/* Form Modal (Create / Edit) */}
          <KelasFormModal
            isOpen={formOpen}
            onClose={() => setFormOpen(false)}
            editData={editTarget}
          />

          {/* Detail Slide-Over */}
          <KelasDetailPanel
            kelas={detailTarget}
            isOpen={!!detailTarget}
            onClose={() => setDetailTarget(null)}
            onEdit={handleOpenEdit}
            onDelete={(kelas) => setDeleteTarget(kelas)}
            onNavigateSiswa={handleNavigateSiswa}
          />

          {/* Confirm Delete */}
          <ConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title="Hapus Kelas"
            onConfirm={handleConfirmDelete}
            isisLoading={deleteMutation.isPending}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Yakin ingin menghapus kelas{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deleteTarget?.namaKelas}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </p>
          </ConfirmModal>
        </div>
      );
    }
""")

# ============================================================
# 2. src/app/dashboard/kelas/_components/KelasFilters.tsx
# ============================================================
files["src/app/dashboard/kelas/_components/KelasFilters.tsx"] = textwrap.dedent("""\
    "use client";

    import { useCallback } from "react";
    import { SearchInput } from "@/components/ui/SearchInput";
    import { Select } from "@/components/ui/Select";
    import { useDebounce } from "@/hooks/useDebounce";
    import { useTahunAjaran } from "@/hooks/tahun-ajaran/useTahunAjaran";
    import { useTingkatKelas } from "@/hooks/tingkat-kelas/useTingkatKelas";
    import type { KelasFilterParams } from "@/types/kelas.types";

    interface Props {
      filters: KelasFilterParams;
      onChange: (filters: KelasFilterParams) => void;
    }

    export function KelasFilters({ filters, onChange }: Props) {
      const { data: tahunAjaranData } = useTahunAjaran();
      const { data: tingkatKelasData } = useTingkatKelas();

      const tahunAjaranOptions = [
        { label: "Semua Tahun Ajaran", value: "" },
        ...(tahunAjaranData?.data ?? []).map((t) => ({
          label: t.nama,
          value: t.id,
        })),
      ];

      const tingkatKelasOptions = [
        { label: "Semua Tingkat", value: "" },
        ...(tingkatKelasData?.data ?? []).map((t) => ({
          label: t.nama,
          value: t.id,
        })),
      ];

      const handleSearch = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
          onChange({ ...filters, namaKelas: e.target.value || undefined });
        },
        [filters, onChange]
      );

      const handleTahunAjaran = useCallback(
        (val: string) => {
          onChange({ ...filters, tahunAjaranId: val || undefined });
        },
        [filters, onChange]
      );

      const handleTingkat = useCallback(
        (val: string) => {
          onChange({ ...filters, tingkatKelasId: val || undefined });
        },
        [filters, onChange]
      );

      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              placeholder="Cari nama kelas..."
              value={filters.namaKelas ?? ""}
              onChange={handleSearch}
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              options={tahunAjaranOptions}
              value={filters.tahunAjaranId ?? ""}
              onChange={handleTahunAjaran}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={tingkatKelasOptions}
              value={filters.tingkatKelasId ?? ""}
              onChange={handleTingkat}
            />
          </div>
        </div>
      );
    }
""")

# ============================================================
# 3. src/app/dashboard/kelas/_components/KelasTable.tsx
# ============================================================
files["src/app/dashboard/kelas/_components/KelasTable.tsx"] = textwrap.dedent("""\
    "use client";

    import { Users, Pencil, Trash2, ExternalLink } from "lucide-react";
    import { Button } from "@/components/ui/Button";
    import { Badge } from "@/components/ui/Badge";
    import { Skeleton } from "@/components/ui/Skeleton";
    import { EmptyState } from "@/components/ui/EmptyState";
    import type { Kelas } from "@/types/kelas.types";

    interface Props {
      data: Kelas[];
      isLoading: boolean;
      isError: boolean;
      activeId?: string;
      onRowClick: (kelas: Kelas) => void;
      onEdit: (kelas: Kelas) => void;
      onDelete: (kelas: Kelas) => void;
      onNavigateSiswa: (kelasId: string) => void;
    }

    export function KelasTable({
      data,
      isLoading,
      isError,
      activeId,
      onRowClick,
      onEdit,
      onDelete,
      onNavigateSiswa,
    }: Props) {
      if (isLoading) return <KelasTableSkeleton />;

      if (isError) {
        return (
          <EmptyState
            title="Gagal memuat data"
            description="Terjadi kesalahan saat mengambil data kelas. Silakan coba lagi."
          />
        );
      }

      if (data.length === 0) {
        return (
          <EmptyState
            title="Belum ada kelas"
            description="Belum ada kelas yang terdaftar. Klik tombol Tambah Kelas untuk memulai."
          />
        );
      }

      return (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Kelas</th>
                  <th className="px-4 py-3 text-left">Tahun Ajaran</th>
                  <th className="px-4 py-3 text-left">Tingkat</th>
                  <th className="px-4 py-3 text-left">Wali Kelas</th>
                  <th className="px-4 py-3 text-left">Ruangan</th>
                  <th className="px-4 py-3 text-center">Siswa</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
                {data.map((kelas) => (
                  <tr
                    key={kelas.id}
                    onClick={() => onRowClick(kelas)}
                    className={[
                      "cursor-pointer transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
                      activeId === kelas.id
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-l-emerald-500"
                        : "",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {kelas.namaKelas}
                      {kelas.kodeKelas && (
                        <span className="ml-2 text-xs text-gray-400">
                          ({kelas.kodeKelas})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {kelas.tahunAjaran.nama}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {kelas.tingkatKelas.nama}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {kelas.waliKelas?.profile.namaLengkap ?? (
                        <span className="text-gray-400 italic text-xs">
                          Belum ditentukan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {kelas.ruangan ?? (
                        <span className="text-gray-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateSiswa(kelas.id);
                        }}
                        className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-medium"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Daftar Siswa
                      </button>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(kelas)}
                          title="Edit kelas"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(kelas)}
                          title="Hapus kelas"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="flex flex-col gap-3 md:hidden">
            {data.map((kelas) => (
              <div
                key={kelas.id}
                onClick={() => onRowClick(kelas)}
                className={[
                  "rounded-xl border p-4 cursor-pointer transition-colors",
                  "bg-white dark:bg-gray-900",
                  activeId === kelas.id
                    ? "border-emerald-500 dark:border-emerald-500"
                    : "border-gray-200 dark:border-gray-700",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {kelas.namaKelas}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {kelas.tahunAjaran.nama} &middot;{" "}
                      {kelas.tingkatKelas.nama}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {kelas.tingkatKelas.nama}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Wali:
                    </span>{" "}
                    {kelas.waliKelas?.profile.namaLengkap ?? "—"}
                  </span>
                  <span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Ruangan:
                    </span>{" "}
                    {kelas.ruangan ?? "—"}
                  </span>
                </div>

                <div
                  className="mt-3 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onNavigateSiswa(kelas.id)}
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Daftar Siswa
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(kelas)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(kelas)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    function KelasTableSkeleton() {
      return (
        <>
          {/* Desktop skeleton */}
          <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["Kelas", "Tahun Ajaran", "Tingkat", "Wali Kelas", "Ruangan", "Siswa", "Aksi"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left">
                        <Skeleton className="h-3 w-20" />
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-12 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-7 w-16 mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile skeleton */}
          <div className="flex flex-col gap-3 md:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"
              >
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3 w-52 mb-3" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </>
      );
    }
""")

# ============================================================
# 4. src/app/dashboard/kelas/_components/KelasFormModal.tsx
# ============================================================
files["src/app/dashboard/kelas/_components/KelasFormModal.tsx"] = textwrap.dedent("""\
    "use client";

    import { useEffect } from "react";
    import { useForm, Controller } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { z } from "zod";
    import { Modal } from "@/components/ui/Modal";
    import { Button } from "@/components/ui/Button";
    import { Input } from "@/components/ui/Input";
    import { Select } from "@/components/ui/Select";
    import { useTahunAjaran } from "@/hooks/tahun-ajaran/useTahunAjaran";
    import { useTingkatKelas } from "@/hooks/tingkat-kelas/useTingkatKelas";
    import {
      useCreateKelas,
      useUpdateKelas,
      useWaliKelasList,
    } from "@/hooks/kelas/useKelas";
    import type { Kelas } from "@/types/kelas.types";

    // ─── Zod Schema ───────────────────────────────────────────────────────────────

    const schema = z.object({
      tahunAjaranId: z.string().min(1, "Tahun ajaran wajib dipilih"),
      tingkatKelasId: z.string().min(1, "Tingkat kelas wajib dipilih"),
      namaKelas: z
        .string()
        .min(1, "Nama kelas wajib diisi")
        .max(50, "Nama kelas maksimal 50 karakter"),
      kodeKelas: z.string().max(20).optional().or(z.literal("")),
      waliKelasId: z.string().optional().or(z.literal("")),
      kuotaMaksimal: z.coerce
        .number()
        .int()
        .min(1, "Minimal 1")
        .max(100, "Maksimal 100")
        .optional(),
      ruangan: z.string().max(50).optional().or(z.literal("")),
    });

    type FormValues = z.infer<typeof schema>;

    // ─── Props ────────────────────────────────────────────────────────────────────

    interface Props {
      isOpen: boolean;
      onClose: () => void;
      editData: Kelas | null;
    }

    export function KelasFormModal({ isOpen, onClose, editData }: Props) {
      const isEdit = !!editData;

      const { data: tahunAjaranData } = useTahunAjaran();
      const { data: tingkatKelasData } = useTingkatKelas();
      const { data: waliKelasList } = useWaliKelasList();

      const createMutation = useCreateKelas();
      const updateMutation = useUpdateKelas(editData?.id ?? "");

      const isPending = createMutation.isPending || updateMutation.isPending;

      // ── Options ─────────────────────────────────────────────────────────────
      const tahunAjaranOptions = [
        { label: "Pilih Tahun Ajaran", value: "" },
        ...(tahunAjaranData?.data ?? []).map((t) => ({
          label: t.nama,
          value: t.id,
        })),
      ];

      const tingkatKelasOptions = [
        { label: "Pilih Tingkat Kelas", value: "" },
        ...(tingkatKelasData?.data ?? []).map((t) => ({
          label: t.nama,
          value: t.id,
        })),
      ];

      const waliKelasOptions = [
        { label: "— Belum ditentukan —", value: "" },
        ...(waliKelasList ?? []).map((u) => ({
          label: u.profile.nip
            ? `${u.profile.namaLengkap} (${u.profile.nip})`
            : u.profile.namaLengkap,
          value: u.id,
        })),
      ];

      // ── Form ─────────────────────────────────────────────────────────────────
      const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
      } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
          tahunAjaranId: "",
          tingkatKelasId: "",
          namaKelas: "",
          kodeKelas: "",
          waliKelasId: "",
          kuotaMaksimal: 36,
          ruangan: "",
        },
      });

      // Reset form saat buka modal
      useEffect(() => {
        if (isOpen) {
          reset(
            editData
              ? {
                  tahunAjaranId: editData.tahunAjaranId,
                  tingkatKelasId: editData.tingkatKelasId,
                  namaKelas: editData.namaKelas,
                  kodeKelas: editData.kodeKelas ?? "",
                  waliKelasId: editData.waliKelasId ?? "",
                  kuotaMaksimal: editData.kuotaMaksimal,
                  ruangan: editData.ruangan ?? "",
                }
              : {
                  tahunAjaranId: "",
                  tingkatKelasId: "",
                  namaKelas: "",
                  kodeKelas: "",
                  waliKelasId: "",
                  kuotaMaksimal: 36,
                  ruangan: "",
                }
          );
        }
      }, [isOpen, editData, reset]);

      const onSubmit = handleSubmit((values) => {
        const dto = {
          tahunAjaranId: values.tahunAjaranId,
          tingkatKelasId: values.tingkatKelasId,
          namaKelas: values.namaKelas,
          kodeKelas: values.kodeKelas || undefined,
          waliKelasId: values.waliKelasId || undefined,
          kuotaMaksimal: values.kuotaMaksimal,
          ruangan: values.ruangan || undefined,
        };

        if (isEdit) {
          updateMutation.mutate(dto, { onSuccess: onClose });
        } else {
          createMutation.mutate(dto, { onSuccess: onClose });
        }
      });

      return (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={isEdit ? "Edit Kelas" : "Tambah Kelas Baru"}
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Tahun Ajaran */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tahunAjaranId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={tahunAjaranOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.tahunAjaranId && (
                <p className="text-xs text-red-500">{errors.tahunAjaranId.message}</p>
              )}
            </div>

            {/* Tingkat Kelas */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tingkat Kelas <span className="text-red-500">*</span>
              </label>
              <Controller
                name="tingkatKelasId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={tingkatKelasOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.tingkatKelasId && (
                <p className="text-xs text-red-500">{errors.tingkatKelasId.message}</p>
              )}
            </div>

            {/* Nama Kelas */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("namaKelas")}
                placeholder="Contoh: XII IPA 1"
                error={errors.namaKelas?.message}
              />
            </div>

            {/* Kode Kelas + Ruangan (2 col) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kode Kelas
                </label>
                <Input
                  {...register("kodeKelas")}
                  placeholder="Contoh: XII-IPA-1"
                  error={errors.kodeKelas?.message}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ruangan
                </label>
                <Input
                  {...register("ruangan")}
                  placeholder="Contoh: Lab. IPA"
                  error={errors.ruangan?.message}
                />
              </div>
            </div>

            {/* Wali Kelas */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Wali Kelas
              </label>
              <Controller
                name="waliKelasId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={waliKelasOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Kuota Maksimal */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Kuota Maksimal Siswa
              </label>
              <Input
                {...register("kuotaMaksimal")}
                type="number"
                min={1}
                max={100}
                placeholder="36"
                error={errors.kuotaMaksimal?.message}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button type="button" variant="ghost" onClick={onClose}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? "Menyimpan..."
                    : "Membuat..."
                  : isEdit
                  ? "Simpan Perubahan"
                  : "Tambah Kelas"}
              </Button>
            </div>
          </form>
        </Modal>
      );
    }
""")

# ============================================================
# 5. src/app/dashboard/kelas/_components/KelasDetailPanel.tsx
# ============================================================
files["src/app/dashboard/kelas/_components/KelasDetailPanel.tsx"] = textwrap.dedent("""\
    "use client";

    import {
      Users,
      Pencil,
      Trash2,
      BookOpen,
      MapPin,
      User,
      Hash,
      ExternalLink,
      BarChart3,
    } from "lucide-react";
    import { SlideOver } from "@/components/ui/SlideOver";
    import { Button } from "@/components/ui/Button";
    import { Badge } from "@/components/ui/Badge";
    import { Skeleton } from "@/components/ui/Skeleton";
    import { useKelasStatistik } from "@/hooks/kelas/useKelas";
    import type { Kelas } from "@/types/kelas.types";

    interface Props {
      kelas: Kelas | null;
      isOpen: boolean;
      onClose: () => void;
      onEdit: (kelas: Kelas) => void;
      onDelete: (kelas: Kelas) => void;
      onNavigateSiswa: (kelasId: string) => void;
    }

    export function KelasDetailPanel({
      kelas,
      isOpen,
      onClose,
      onEdit,
      onDelete,
      onNavigateSiswa,
    }: Props) {
      const { data: statistik, isLoading: loadingStatistik } = useKelasStatistik(
        kelas?.id ?? null
      );

      return (
        <SlideOver
          isOpen={isOpen}
          onClose={onClose}
          title={kelas?.namaKelas ?? "Detail Kelas"}
        >
          {kelas && (
            <div className="flex flex-col gap-6 pb-6">
              {/* ── Header badge info ─────────────────────────────────────── */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{kelas.tahunAjaran.nama}</Badge>
                <Badge variant="primary">{kelas.tingkatKelas.nama}</Badge>
                {kelas.kodeKelas && (
                  <Badge variant="outline">{kelas.kodeKelas}</Badge>
                )}
              </div>

              {/* ── Info detail ────────────────────────────────────────────── */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                <InfoRow
                  icon={<User className="h-4 w-4 text-gray-400" />}
                  label="Wali Kelas"
                  value={kelas.waliKelas?.profile.namaLengkap ?? "Belum ditentukan"}
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4 text-gray-400" />}
                  label="Ruangan"
                  value={kelas.ruangan ?? "—"}
                />
                <InfoRow
                  icon={<Hash className="h-4 w-4 text-gray-400" />}
                  label="Kuota Maksimal"
                  value={`${kelas.kuotaMaksimal} siswa`}
                />
                <InfoRow
                  icon={<BookOpen className="h-4 w-4 text-gray-400" />}
                  label="Tahun Ajaran"
                  value={kelas.tahunAjaran.nama}
                />
              </div>

              {/* ── Statistik siswa ───────────────────────────────────────── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Statistik Siswa
                  </h3>
                </div>

                {loadingStatistik ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                  </div>
                ) : statistik ? (
                  <>
                    {/* Kuota bar */}
                    <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        <span>
                          Terisi:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {statistik.berdasarkanStatus.AKTIF}
                          </span>
                        </span>
                        <span>
                          Kuota:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {statistik.kuotaMaksimal}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (statistik.berdasarkanStatus.AKTIF /
                                statistik.kuotaMaksimal) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5 text-right">
                        Sisa kuota:{" "}
                        <span
                          className={
                            statistik.sisaKuota <= 0
                              ? "text-red-500 font-semibold"
                              : "text-emerald-600 font-semibold"
                          }
                        >
                          {statistik.sisaKuota}
                        </span>
                      </p>
                    </div>

                    {/* Gender */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <StatCard
                        label="Laki-laki"
                        value={statistik.berdasarkanGender.L}
                        color="blue"
                      />
                      <StatCard
                        label="Perempuan"
                        value={statistik.berdasarkanGender.P}
                        color="pink"
                      />
                    </div>

                    {/* Status breakdown */}
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["AKTIF", "emerald"],
                          ["PINDAH", "yellow"],
                          ["KELUAR", "red"],
                          ["LULUS", "blue"],
                          ["DO", "gray"],
                        ] as const
                      ).map(([status, color]) => (
                        <StatusBadge
                          key={status}
                          label={status}
                          value={statistik.berdasarkanStatus[status] ?? 0}
                          color={color}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    Data statistik tidak tersedia
                  </p>
                )}
              </div>

              {/* ── Tautan ke daftar siswa ─────────────────────────────────── */}
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={() => onNavigateSiswa(kelas.id)}
              >
                <Users className="h-4 w-4" />
                Lihat Daftar Siswa
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>

              {/* ── Aksi ──────────────────────────────────────────────────── */}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => onEdit(kelas)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Kelas
                </Button>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onDelete(kelas)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </SlideOver>
      );
    }

    // ─── Sub-components ───────────────────────────────────────────────────────────

    function InfoRow({
      icon,
      label,
      value,
    }: {
      icon: React.ReactNode;
      label: string;
      value: string;
    }) {
      return (
        <div className="flex items-center gap-3 px-4 py-3">
          {icon}
          <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">
            {label}
          </span>
          <span className="text-sm text-gray-900 dark:text-white font-medium">
            {value}
          </span>
        </div>
      );
    }

    const colorMap = {
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
      pink: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300",
      emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
      red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
      gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    } as const;

    type ColorKey = keyof typeof colorMap;

    function StatCard({
      label,
      value,
      color,
    }: {
      label: string;
      value: number;
      color: ColorKey;
    }) {
      return (
        <div
          className={[
            "rounded-xl p-3 flex flex-col items-center justify-center gap-1",
            colorMap[color],
          ].join(" ")}
        >
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs font-medium">{label}</span>
        </div>
      );
    }

    function StatusBadge({
      label,
      value,
      color,
    }: {
      label: string;
      value: number;
      color: ColorKey;
    }) {
      return (
        <div className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700/60 px-3 py-2 bg-white dark:bg-gray-900">
          <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          <span
            className={[
              "text-xs font-bold px-1.5 py-0.5 rounded-md",
              colorMap[color],
            ].join(" ")}
          >
            {value}
          </span>
        </div>
      );
    }
""")

# ─── Writer ───────────────────────────────────────────────────────────────────

def write_files(base_dir: str = ".") -> None:
    for rel_path, content in files.items():
        full_path = os.path.join(base_dir, rel_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  {rel_path}")

if __name__ == "__main__":
    import sys
    base = sys.argv[1] if len(sys.argv) > 1 else "."
    write_files(base)
    print("\nBatch 3 selesai - Halaman Master Kelas (5 files)")