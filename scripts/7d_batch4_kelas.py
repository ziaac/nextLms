import os, textwrap

files = {}

# ============================================================
# 1. src/app/dashboard/kelas/[id]/siswa/page.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/page.tsx"] = textwrap.dedent("""\
    "use client";

    import { useState, useCallback } from "react";
    import { useParams, useRouter } from "next/navigation";
    import { ArrowLeft, Plus, Upload, Copy, Search } from "lucide-react";
    import { PageHeader } from "@/components/ui/PageHeader";
    import { Button } from "@/components/ui/Button";
    import { SearchInput } from "@/components/ui/SearchInput";
    import { Select } from "@/components/ui/Select";
    import { useKelasById } from "@/hooks/kelas/useKelas";
    import { useSiswaByKelas } from "@/hooks/kelas/useKelasSiswa";
    import { KelasInfoCards } from "./_components/KelasInfoCards";
    import { KelasSiswaTable } from "./_components/KelasSiswaTable";
    import { TambahSiswaModal } from "./_components/TambahSiswaModal";
    import { TambahSiswaBulkModal } from "./_components/TambahSiswaBulkModal";
    import { MutasiSiswaModal } from "./_components/MutasiSiswaModal";
    import { SiswaDetailPanel } from "./_components/SiswaDetailPanel";
    import { CopySiswaModal } from "./_components/CopySiswaModal";
    import { StatusSiswa } from "@/types/kelas.types";
    import type { KelasSiswa } from "@/types/kelas.types";

    const STATUS_OPTIONS = [
      { label: "Semua Status", value: "" },
      { label: "Aktif", value: StatusSiswa.AKTIF },
      { label: "Pindah", value: StatusSiswa.PINDAH },
      { label: "Keluar", value: StatusSiswa.KELUAR },
      { label: "Lulus", value: StatusSiswa.LULUS },
      { label: "DO", value: StatusSiswa.DO },
      { label: "Mengundurkan Diri", value: StatusSiswa.MENGUNDURKAN_DIRI },
    ];

    export default function KelasSiswaPage() {
      const params = useParams<{ id: string }>();
      const router = useRouter();
      const kelasId = params.id;

      // ── Filter state ──────────────────────────────────────────────────────────
      const [search, setSearch] = useState("");
      const [statusFilter, setStatusFilter] = useState<string>("");

      // ── Modal / panel state ───────────────────────────────────────────────────
      const [tambahOpen, setTambahOpen] = useState(false);
      const [bulkOpen, setBulkOpen] = useState(false);
      const [copyOpen, setCopyOpen] = useState(false);
      const [mutasiTarget, setMutasiTarget] = useState<KelasSiswa | null>(null);
      const [detailTarget, setDetailTarget] = useState<KelasSiswa | null>(null);

      // ── Data ──────────────────────────────────────────────────────────────────
      const { data: kelasData, isLoading: loadingKelas } = useKelasById(kelasId);
      const { data: siswaData, isLoading: loadingSiswa } = useSiswaByKelas(kelasId);

      const allSiswa = siswaData?.data ?? [];

      // Client-side filter
      const filteredSiswa = allSiswa.filter((ks) => {
        const matchSearch =
          search === "" ||
          ks.siswa.profile.namaLengkap
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (ks.siswa.profile.nisn ?? "").includes(search);
        const matchStatus =
          statusFilter === "" || ks.status === statusFilter;
        return matchSearch && matchStatus;
      });

      const handleRowClick = useCallback((ks: KelasSiswa) => {
        setDetailTarget(ks);
      }, []);

      return (
        <div className="flex flex-col gap-4 p-4 md:p-6">
          {/* Back + header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Kembali"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <PageHeader
              title={
                loadingKelas
                  ? "Memuat..."
                  : `Daftar Siswa — ${kelasData?.namaKelas ?? ""}`
              }
              description={
                kelasData
                  ? `${kelasData.tahunAjaran.nama} · ${kelasData.tingkatKelas.nama}`
                  : undefined
              }
            />
          </div>

          {/* Stat cards */}
          <KelasInfoCards kelas={kelasData ?? null} siswaList={allSiswa} />

          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                placeholder="Cari nama / NISN siswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-52">
              <Select
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCopyOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salin dari TA Lalu</span>
                <span className="sm:hidden">Salin</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setBulkOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tambah Bulk</span>
                <span className="sm:hidden">Bulk</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setTambahOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Siswa
              </Button>
            </div>
          </div>

          {/* Table */}
          <KelasSiswaTable
            data={filteredSiswa}
            isLoading={loadingSiswa}
            activeId={detailTarget?.id}
            onRowClick={handleRowClick}
            onMutasi={(ks) => setMutasiTarget(ks)}
          />

          {/* Modals */}
          <TambahSiswaModal
            isOpen={tambahOpen}
            onClose={() => setTambahOpen(false)}
            kelasId={kelasId}
          />
          <TambahSiswaBulkModal
            isOpen={bulkOpen}
            onClose={() => setBulkOpen(false)}
            kelasId={kelasId}
            tahunAjaranId={kelasData?.tahunAjaranId ?? ""}
          />
          <CopySiswaModal
            isOpen={copyOpen}
            onClose={() => setCopyOpen(false)}
            kelasId={kelasId}
            namaKelas={kelasData?.namaKelas ?? ""}
          />
          <MutasiSiswaModal
            isOpen={!!mutasiTarget}
            onClose={() => setMutasiTarget(null)}
            kelasSiswa={mutasiTarget}
            kelasId={kelasId}
          />

          {/* Slide-over detail siswa */}
          <SiswaDetailPanel
            kelasSiswa={detailTarget}
            isOpen={!!detailTarget}
            onClose={() => setDetailTarget(null)}
            onMutasi={(ks) => {
              setDetailTarget(null);
              setMutasiTarget(ks);
            }}
          />
        </div>
      );
    }
""")

# ============================================================
# 2. _components/KelasInfoCards.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/KelasInfoCards.tsx"] = textwrap.dedent("""\
    "use client";

    import { Users, UserCheck, DoorOpen, GraduationCap, BookOpen } from "lucide-react";
    import { Skeleton } from "@/components/ui/Skeleton";
    import { StatusSiswa } from "@/types/kelas.types";
    import type { Kelas, KelasSiswa } from "@/types/kelas.types";

    interface Props {
      kelas: Kelas | null;
      siswaList: KelasSiswa[];
    }

    export function KelasInfoCards({ kelas, siswaList }: Props) {
      const aktif = siswaList.filter((s) => s.status === StatusSiswa.AKTIF).length;
      const pindah = siswaList.filter((s) => s.status === StatusSiswa.PINDAH).length;
      const keluar = siswaList.filter(
        (s) =>
          s.status === StatusSiswa.KELUAR ||
          s.status === StatusSiswa.DO ||
          s.status === StatusSiswa.MENGUNDURKAN_DIRI
      ).length;
      const lulus = siswaList.filter((s) => s.status === StatusSiswa.LULUS).length;

      if (!kelas) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        );
      }

      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <InfoCard
            icon={<BookOpen className="h-4 w-4" />}
            label="Kelas"
            value={kelas.namaKelas}
            sub={kelas.waliKelas?.profile.namaLengkap ?? "Belum ada wali kelas"}
            color="emerald"
          />
          <InfoCard
            icon={<UserCheck className="h-4 w-4" />}
            label="Siswa Aktif"
            value={String(aktif)}
            sub={`dari ${kelas.kuotaMaksimal} kuota`}
            color="blue"
          />
          <InfoCard
            icon={<DoorOpen className="h-4 w-4" />}
            label="Pindah / Keluar"
            value={String(pindah + keluar)}
            sub={`${pindah} pindah · ${keluar} keluar`}
            color="yellow"
          />
          <InfoCard
            icon={<GraduationCap className="h-4 w-4" />}
            label="Lulus"
            value={String(lulus)}
            sub="Seluruh masa aktif"
            color="purple"
          />
        </div>
      );
    }

    type Color = "emerald" | "blue" | "yellow" | "purple";

    const colorCls: Record<Color, { bg: string; icon: string; value: string }> = {
      emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        icon: "text-emerald-600 dark:text-emerald-400",
        value: "text-emerald-700 dark:text-emerald-300",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        icon: "text-blue-600 dark:text-blue-400",
        value: "text-blue-700 dark:text-blue-300",
      },
      yellow: {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        icon: "text-yellow-600 dark:text-yellow-400",
        value: "text-yellow-700 dark:text-yellow-300",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        icon: "text-purple-600 dark:text-purple-400",
        value: "text-purple-700 dark:text-purple-300",
      },
    };

    function InfoCard({
      icon,
      label,
      value,
      sub,
      color,
    }: {
      icon: React.ReactNode;
      label: string;
      value: string;
      sub: string;
      color: Color;
    }) {
      const cls = colorCls[color];
      return (
        <div
          className={[
            "rounded-xl p-4 flex flex-col gap-1",
            cls.bg,
          ].join(" ")}
        >
          <div className={["flex items-center gap-1.5 text-xs font-medium", cls.icon].join(" ")}>
            {icon}
            {label}
          </div>
          <p className={["text-xl font-bold", cls.value].join(" ")}>{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub}</p>
        </div>
      );
    }
""")

# ============================================================
# 3. _components/KelasSiswaTable.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/KelasSiswaTable.tsx"] = textwrap.dedent("""\
    "use client";

    import { ArrowRightLeft } from "lucide-react";
    import { Button } from "@/components/ui/Button";
    import { Badge } from "@/components/ui/Badge";
    import { Skeleton } from "@/components/ui/Skeleton";
    import { EmptyState } from "@/components/ui/EmptyState";
    import { StatusSiswa } from "@/types/kelas.types";
    import type { KelasSiswa } from "@/types/kelas.types";

    interface Props {
      data: KelasSiswa[];
      isLoading: boolean;
      activeId?: string;
      onRowClick: (ks: KelasSiswa) => void;
      onMutasi: (ks: KelasSiswa) => void;
    }

    const statusConfig: Record<
      StatusSiswa,
      { label: string; variant: "success" | "warning" | "danger" | "secondary" | "outline" }
    > = {
      [StatusSiswa.AKTIF]: { label: "Aktif", variant: "success" },
      [StatusSiswa.PINDAH]: { label: "Pindah", variant: "warning" },
      [StatusSiswa.KELUAR]: { label: "Keluar", variant: "danger" },
      [StatusSiswa.LULUS]: { label: "Lulus", variant: "secondary" },
      [StatusSiswa.DO]: { label: "DO", variant: "danger" },
      [StatusSiswa.MENGUNDURKAN_DIRI]: { label: "Undur Diri", variant: "outline" },
    };

    export function KelasSiswaTable({
      data,
      isLoading,
      activeId,
      onRowClick,
      onMutasi,
    }: Props) {
      if (isLoading) return <KelasSiswaTableSkeleton />;

      if (data.length === 0) {
        return (
          <EmptyState
            title="Tidak ada siswa"
            description="Belum ada siswa di kelas ini atau tidak ada yang cocok dengan filter."
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
                  <th className="px-4 py-3 text-center w-14">No. Absen</th>
                  <th className="px-4 py-3 text-left">Nama Lengkap</th>
                  <th className="px-4 py-3 text-left">NISN</th>
                  <th className="px-4 py-3 text-center">L/P</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
                {data.map((ks) => {
                  const cfg = statusConfig[ks.status];
                  return (
                    <tr
                      key={ks.id}
                      onClick={() => onRowClick(ks)}
                      className={[
                        "cursor-pointer transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/10",
                        activeId === ks.id
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-l-emerald-500"
                          : "",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 text-center font-mono text-gray-500">
                        {ks.nomorAbsen ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {ks.siswa.profile.namaLengkap}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400 text-xs">
                        {ks.siswa.profile.nisn ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {ks.siswa.profile.jenisKelamin}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onMutasi(ks)}
                          className="flex items-center gap-1 text-xs"
                          title="Mutasi / Ubah Status"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          Mutasi
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="flex flex-col gap-2 md:hidden">
            {data.map((ks) => {
              const cfg = statusConfig[ks.status];
              return (
                <div
                  key={ks.id}
                  onClick={() => onRowClick(ks)}
                  className={[
                    "rounded-xl border p-4 cursor-pointer transition-colors bg-white dark:bg-gray-900",
                    activeId === ks.id
                      ? "border-emerald-500"
                      : "border-gray-200 dark:border-gray-700",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 w-6 shrink-0">
                          {ks.nomorAbsen ?? "—"}
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {ks.siswa.profile.namaLengkap}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5 ml-8">
                        {ks.siswa.profile.nisn
                          ? `NISN: ${ks.siswa.profile.nisn}`
                          : "—"}{" "}
                        · {ks.siswa.profile.jenisKelamin}
                      </p>
                    </div>
                    <Badge variant={cfg.variant} className="shrink-0">
                      {cfg.label}
                    </Badge>
                  </div>
                  <div
                    className="mt-3 flex justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMutasi(ks)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Mutasi
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      );
    }

    function KelasSiswaTableSkeleton() {
      return (
        <>
          <div className="hidden md:block rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {["No", "Nama", "NISN", "L/P", "Status", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-3">
                      <Skeleton className="h-3 w-16" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-900">
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-7 w-16 mx-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 md:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </>
      );
    }
""")

# ============================================================
# 4. _components/TambahSiswaModal.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/TambahSiswaModal.tsx"] = textwrap.dedent("""\
    "use client";

    import { useState, useMemo } from "react";
    import { useForm, Controller } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { z } from "zod";
    import { Search } from "lucide-react";
    import { Modal } from "@/components/ui/Modal";
    import { Button } from "@/components/ui/Button";
    import { Input } from "@/components/ui/Input";
    import { useQuery } from "@tanstack/react-query";
    import { getUsersByRole } from "@/lib/api/kelas.api";
    import { useTambahSiswa } from "@/hooks/kelas/useKelasSiswa";
    import type { UserByRole } from "@/types/kelas.types";

    const schema = z.object({
      siswaId: z.string().min(1, "Pilih siswa terlebih dahulu"),
      tanggalMasuk: z.string().min(1, "Tanggal masuk wajib diisi"),
    });

    type FormValues = z.infer<typeof schema>;

    interface Props {
      isOpen: boolean;
      onClose: () => void;
      kelasId: string;
    }

    export function TambahSiswaModal({ isOpen, onClose, kelasId }: Props) {
      const [searchQuery, setSearchQuery] = useState("");
      const [selectedSiswa, setSelectedSiswa] = useState<UserByRole | null>(null);

      const { data: siswaList = [], isLoading: loadingSiswa } = useQuery({
        queryKey: ["users", "by-role", "SISWA"],
        queryFn: () => getUsersByRole("SISWA"),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
      });

      const filteredSiswa = useMemo(() => {
        if (!searchQuery.trim()) return siswaList.slice(0, 20);
        const q = searchQuery.toLowerCase();
        return siswaList
          .filter(
            (s) =>
              s.profile.namaLengkap.toLowerCase().includes(q) ||
              (s.profile.nisn ?? "").includes(q) ||
              (s.profile.nip ?? "").includes(q)
          )
          .slice(0, 20);
      }, [siswaList, searchQuery]);

      const mutation = useTambahSiswa(kelasId);

      const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors },
      } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { siswaId: "", tanggalMasuk: "" },
      });

      const handleSelect = (siswa: UserByRole) => {
        setSelectedSiswa(siswa);
        setValue("siswaId", siswa.id, { shouldValidate: true });
        setSearchQuery("");
      };

      const handleClose = () => {
        reset();
        setSelectedSiswa(null);
        setSearchQuery("");
        onClose();
      };

      const onSubmit = handleSubmit((values) => {
        mutation.mutate(
          { siswaId: values.siswaId, tanggalMasuk: values.tanggalMasuk },
          { onSuccess: handleClose }
        );
      });

      return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Siswa ke Kelas">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Siswa search */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cari Siswa <span className="text-red-500">*</span>
              </label>

              {selectedSiswa ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedSiswa.profile.namaLengkap}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedSiswa.profile.nisn
                        ? `NISN: ${selectedSiswa.profile.nisn}`
                        : "Tanpa NISN"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSiswa(null);
                      setValue("siswaId", "");
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ketik nama atau NISN siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: "16px" }}
                  />
                  {/* Dropdown hasil pencarian */}
                  {searchQuery.length >= 1 && (
                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                      {loadingSiswa ? (
                        <p className="px-4 py-3 text-sm text-gray-400">Memuat...</p>
                      ) : filteredSiswa.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-400">
                          Siswa tidak ditemukan
                        </p>
                      ) : (
                        filteredSiswa.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelect(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {s.profile.namaLengkap}
                            </p>
                            <p className="text-xs text-gray-400">
                              {s.profile.nisn
                                ? `NISN: ${s.profile.nisn}`
                                : "Tanpa NISN"}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Hidden field untuk validasi */}
              <input type="hidden" {...register("siswaId")} />
              {errors.siswaId && (
                <p className="text-xs text-red-500">{errors.siswaId.message}</p>
              )}
            </div>

            {/* Tanggal masuk */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Masuk <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("tanggalMasuk")}
                type="date"
                error={errors.tanggalMasuk?.message}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Batal
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Menyimpan..." : "Tambah Siswa"}
              </Button>
            </div>
          </form>
        </Modal>
      );
    }
""")

# ============================================================
# 5. _components/TambahSiswaBulkModal.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/TambahSiswaBulkModal.tsx"] = textwrap.dedent("""\
    "use client";

    import { useState, useMemo } from "react";
    import { useForm } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { z } from "zod";
    import { Search } from "lucide-react";
    import { Modal } from "@/components/ui/Modal";
    import { Button } from "@/components/ui/Button";
    import { Input } from "@/components/ui/Input";
    import { Skeleton } from "@/components/ui/Skeleton";
    import { useQuery } from "@tanstack/react-query";
    import { getUsersByRole } from "@/lib/api/kelas.api";
    import { useTambahSiswaBulk } from "@/hooks/kelas/useKelasSiswa";
    import type { UserByRole } from "@/types/kelas.types";

    const schema = z.object({
      tanggalMasuk: z.string().min(1, "Tanggal masuk wajib diisi"),
    });

    type FormValues = z.infer<typeof schema>;

    interface Props {
      isOpen: boolean;
      onClose: () => void;
      kelasId: string;
      tahunAjaranId: string;
    }

    export function TambahSiswaBulkModal({
      isOpen,
      onClose,
      kelasId,
      tahunAjaranId,
    }: Props) {
      const [searchQuery, setSearchQuery] = useState("");
      const [selected, setSelected] = useState<Set<string>>(new Set());

      const { data: siswaList = [], isLoading } = useQuery({
        queryKey: ["users", "by-role", "SISWA"],
        queryFn: () => getUsersByRole("SISWA"),
        enabled: isOpen,
        staleTime: 1000 * 60 * 5,
      });

      const filteredSiswa = useMemo(() => {
        if (!searchQuery.trim()) return siswaList;
        const q = searchQuery.toLowerCase();
        return siswaList.filter(
          (s) =>
            s.profile.namaLengkap.toLowerCase().includes(q) ||
            (s.profile.nisn ?? "").includes(q)
        );
      }, [siswaList, searchQuery]);

      const mutation = useTambahSiswaBulk(kelasId);

      const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { tanggalMasuk: "" },
      });

      const toggleSelect = (id: string) => {
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      };

      const toggleAll = () => {
        if (selected.size === filteredSiswa.length) {
          setSelected(new Set());
        } else {
          setSelected(new Set(filteredSiswa.map((s) => s.id)));
        }
      };

      const handleClose = () => {
        reset();
        setSelected(new Set());
        setSearchQuery("");
        onClose();
      };

      const onSubmit = handleSubmit((values) => {
        const payload = Array.from(selected).map((siswaId) => ({
          siswaId,
          tanggalMasuk: values.tanggalMasuk,
        }));
        mutation.mutate(
          { siswa: payload },
          { onSuccess: handleClose }
        );
      });

      const allFilteredSelected =
        filteredSiswa.length > 0 &&
        filteredSiswa.every((s) => selected.has(s.id));

      return (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title="Tambah Siswa Bulk"
        >
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {/* Tanggal masuk global */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Masuk (untuk semua){" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("tanggalMasuk")}
                type="date"
                error={errors.tanggalMasuk?.message}
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Cari nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Counter */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{selected.size} siswa dipilih</span>
              {filteredSiswa.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {allFilteredSelected ? "Batal pilih semua" : "Pilih semua"}
                </button>
              )}
            </div>

            {/* Daftar siswa dengan checkbox */}
            <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : filteredSiswa.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">
                  Tidak ada siswa ditemukan
                </p>
              ) : (
                filteredSiswa.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 accent-emerald-600"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {s.profile.namaLengkap}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {s.profile.nisn
                          ? `NISN: ${s.profile.nisn}`
                          : "Tanpa NISN"}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || selected.size === 0}
              >
                {mutation.isPending
                  ? "Menyimpan..."
                  : `Tambah ${selected.size} Siswa`}
              </Button>
            </div>
          </form>
        </Modal>
      );
    }
""")

# ============================================================
# 6. _components/CopySiswaModal.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/CopySiswaModal.tsx"] = textwrap.dedent("""\
    "use client";

    import { Modal } from "@/components/ui/Modal";
    import { Button } from "@/components/ui/Button";
    import { Copy } from "lucide-react";
    import { useCopySiswaKelas } from "@/hooks/kelas/useKelas";

    interface Props {
      isOpen: boolean;
      onClose: () => void;
      kelasId: string;
      namaKelas: string;
    }

    export function CopySiswaModal({ isOpen, onClose, kelasId, namaKelas }: Props) {
      const mutation = useCopySiswaKelas(kelasId);

      const handleConfirm = () => {
        mutation.mutate(undefined, { onSuccess: onClose });
      };

      return (
        <Modal isOpen={isOpen} onClose={onClose} title="Salin Siswa dari Tahun Ajaran Lalu">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 p-4 text-sm text-yellow-800 dark:text-yellow-300">
              <p>
                Fitur ini akan menyalin seluruh siswa <strong>aktif</strong> dari
                kelas yang sama di tahun ajaran sebelumnya ke kelas{" "}
                <strong>{namaKelas}</strong>.
              </p>
              <p className="mt-2">
                Siswa yang sudah ada di kelas ini tidak akan diduplikat.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose}>
                Batal
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={mutation.isPending}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {mutation.isPending ? "Menyalin..." : "Ya, Salin Siswa"}
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
""")

# ============================================================
# 7. _components/MutasiSiswaModal.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/MutasiSiswaModal.tsx"] = textwrap.dedent("""\
    "use client";

    import { useEffect, useState } from "react";
    import { useForm, Controller } from "react-hook-form";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { z } from "zod";
    import { Modal } from "@/components/ui/Modal";
    import { Button } from "@/components/ui/Button";
    import { Input } from "@/components/ui/Input";
    import { Select } from "@/components/ui/Select";
    import { useKelasList } from "@/hooks/kelas/useKelas";
    import { usePindahSiswa, useKeluarkanSiswa } from "@/hooks/kelas/useKelasSiswa";
    import { StatusSiswa } from "@/types/kelas.types";
    import type { KelasSiswa } from "@/types/kelas.types";

    type TipeMutasi = "PINDAH" | "KELUAR";

    const schemaPindah = z.object({
      kelasBaruId: z.string().min(1, "Pilih kelas tujuan"),
      tanggalPindah: z.string().min(1, "Tanggal pindah wajib diisi"),
      alasan: z.string().optional(),
    });

    const schemaKeluar = z.object({
      status: z.enum([StatusSiswa.KELUAR, StatusSiswa.DO, StatusSiswa.MENGUNDURKAN_DIRI], {
        required_error: "Pilih status keluarnya",
      }),
      tanggalKeluar: z.string().min(1, "Tanggal keluar wajib diisi"),
      alasan: z.string().optional(),
    });

    type PindahValues = z.infer<typeof schemaPindah>;
    type KeluarValues = z.infer<typeof schemaKeluar>;

    interface Props {
      isOpen: boolean;
      onClose: () => void;
      kelasSiswa: KelasSiswa | null;
      kelasId: string;
    }

    const STATUS_KELUAR_OPTIONS = [
      { label: "Pilih status keluar", value: "" },
      { label: "Keluar", value: StatusSiswa.KELUAR },
      { label: "Lulus", value: StatusSiswa.LULUS },
      { label: "Drop Out (DO)", value: StatusSiswa.DO },
      { label: "Mengundurkan Diri", value: StatusSiswa.MENGUNDURKAN_DIRI },
    ];

    export function MutasiSiswaModal({
      isOpen,
      onClose,
      kelasSiswa,
      kelasId,
    }: Props) {
      const [tipeMutasi, setTipeMutasi] = useState<TipeMutasi>("PINDAH");

      const { data: kelasData } = useKelasList();
      const kelasOptions = [
        { label: "Pilih kelas tujuan", value: "" },
        ...(kelasData?.data ?? [])
          .filter((k) => k.id !== kelasId)
          .map((k) => ({ label: k.namaKelas, value: k.id })),
      ];

      const pindahMutation = usePindahSiswa(kelasId);
      const keluarMutation = useKeluarkanSiswa(kelasId);

      // Form Pindah
      const {
        register: regPindah,
        handleSubmit: submitPindah,
        control: ctrlPindah,
        reset: resetPindah,
        formState: { errors: errPindah },
      } = useForm<PindahValues>({
        resolver: zodResolver(schemaPindah),
        defaultValues: { kelasBaruId: "", tanggalPindah: "", alasan: "" },
      });

      // Form Keluar
      const {
        register: regKeluar,
        handleSubmit: submitKeluar,
        control: ctrlKeluar,
        reset: resetKeluar,
        formState: { errors: errKeluar },
      } = useForm<KeluarValues>({
        resolver: zodResolver(schemaKeluar),
        defaultValues: { tanggalKeluar: "", alasan: "" },
      });

      useEffect(() => {
        if (isOpen) {
          setTipeMutasi("PINDAH");
          resetPindah();
          resetKeluar();
        }
      }, [isOpen, resetPindah, resetKeluar]);

      const handlePindah = submitPindah((values) => {
        if (!kelasSiswa) return;
        pindahMutation.mutate(
          {
            siswaId: kelasSiswa.siswaId,
            dto: {
              kelasBaruId: values.kelasBaruId,
              tanggalPindah: values.tanggalPindah,
              alasan: values.alasan || undefined,
            },
          },
          { onSuccess: onClose }
        );
      });

      const handleKeluar = submitKeluar((values) => {
        if (!kelasSiswa) return;
        keluarMutation.mutate(
          {
            siswaId: kelasSiswa.siswaId,
            dto: {
              tanggalKeluar: values.tanggalKeluar,
              status: values.status,
              alasan: values.alasan || undefined,
            },
          },
          { onSuccess: onClose }
        );
      });

      const isPending = pindahMutation.isPending || keluarMutation.isPending;

      return (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          title={`Mutasi Siswa — ${kelasSiswa?.siswa.profile.namaLengkap ?? ""}`}
        >
          <div className="flex flex-col gap-4">
            {/* Tipe mutasi toggle */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {(["PINDAH", "KELUAR"] as TipeMutasi[]).map((tipe) => (
                <button
                  key={tipe}
                  type="button"
                  onClick={() => setTipeMutasi(tipe)}
                  className={[
                    "flex-1 py-2.5 text-sm font-medium transition-colors",
                    tipeMutasi === tipe
                      ? "bg-emerald-600 text-white"
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                  ].join(" ")}
                >
                  {tipe === "PINDAH" ? "Pindah Kelas" : "Keluar / Lulus / DO"}
                </button>
              ))}
            </div>

            {/* Form: Pindah Kelas */}
            {tipeMutasi === "PINDAH" && (
              <form onSubmit={handlePindah} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kelas Tujuan <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="kelasBaruId"
                    control={ctrlPindah}
                    render={({ field }) => (
                      <Select
                        options={kelasOptions}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errPindah.kelasBaruId && (
                    <p className="text-xs text-red-500">{errPindah.kelasBaruId.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tanggal Pindah <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...regPindah("tanggalPindah")}
                    type="date"
                    error={errPindah.tanggalPindah?.message}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alasan (opsional)
                  </label>
                  <textarea
                    {...regPindah("alasan")}
                    rows={3}
                    placeholder="Alasan kepindahan..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Memproses..." : "Pindahkan Siswa"}
                  </Button>
                </div>
              </form>
            )}

            {/* Form: Keluar / DO / Lulus */}
            {tipeMutasi === "KELUAR" && (
              <form onSubmit={handleKeluar} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status Keluar <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="status"
                    control={ctrlKeluar}
                    render={({ field }) => (
                      <Select
                        options={STATUS_KELUAR_OPTIONS}
                        value={field.value ?? ""}
                        onChange={(val) =>
                          field.onChange(val as KeluarValues["status"])
                        }
                      />
                    )}
                  />
                  {errKeluar.status && (
                    <p className="text-xs text-red-500">{errKeluar.status.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tanggal Keluar <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...regKeluar("tanggalKeluar")}
                    type="date"
                    error={errKeluar.tanggalKeluar?.message}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alasan (opsional)
                  </label>
                  <textarea
                    {...regKeluar("alasan")}
                    rows={3}
                    placeholder="Alasan keluar, keterangan DO, dsb..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  >
                    {isPending ? "Memproses..." : "Keluarkan Siswa"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      );
    }
""")

# ============================================================
# 8. _components/SiswaDetailPanel.tsx
# ============================================================
files["src/app/dashboard/kelas/[id]/siswa/_components/SiswaDetailPanel.tsx"] = textwrap.dedent("""\
    "use client";

    import {
      User,
      Phone,
      MapPin,
      BookOpen,
      Award,
      Heart,
      ArrowRightLeft,
      Calendar,
      BarChart3,
      CheckCircle2,
    } from "lucide-react";
    import { SlideOver } from "@/components/ui/SlideOver";
    import { Button } from "@/components/ui/Button";
    import { Badge } from "@/components/ui/Badge";
    import { Skeleton } from "@/components/ui/Skeleton";
    import {
      useAbsensiRekapSiswa,
      useCatatanSikapRekap,
      usePrestasiSiswa,
      useNilaiRaporSiswa,
    } from "@/hooks/kelas/useKelasSiswa";
    import { formatTanggalSaja } from "@/lib/helpers/timezone";
    import { StatusSiswa } from "@/types/kelas.types";
    import type { KelasSiswa } from "@/types/kelas.types";

    interface Props {
      kelasSiswa: KelasSiswa | null;
      isOpen: boolean;
      onClose: () => void;
      onMutasi: (ks: KelasSiswa) => void;
    }

    const statusConfig: Record<StatusSiswa, { label: string; variant: "success" | "warning" | "danger" | "secondary" | "outline" }> = {
      [StatusSiswa.AKTIF]: { label: "Aktif", variant: "success" },
      [StatusSiswa.PINDAH]: { label: "Pindah", variant: "warning" },
      [StatusSiswa.KELUAR]: { label: "Keluar", variant: "danger" },
      [StatusSiswa.LULUS]: { label: "Lulus", variant: "secondary" },
      [StatusSiswa.DO]: { label: "DO", variant: "danger" },
      [StatusSiswa.MENGUNDURKAN_DIRI]: { label: "Undur Diri", variant: "outline" },
    };

    export function SiswaDetailPanel({ kelasSiswa, isOpen, onClose, onMutasi }: Props) {
      const siswaId = kelasSiswa?.siswaId ?? null;
      const profil = kelasSiswa?.siswa.profile;

      const { data: absensi, isLoading: loadAbsensi } = useAbsensiRekapSiswa(siswaId);
      const { data: sikap, isLoading: loadSikap } = useCatatanSikapRekap(siswaId);
      const { data: prestasiResp, isLoading: loadPrestasi } = usePrestasiSiswa(siswaId);
      const { data: nilaiResp, isLoading: loadNilai } = useNilaiRaporSiswa(siswaId);

      const prestasi = prestasiResp?.data ?? [];
      const nilaiList = nilaiResp?.data ?? [];

      return (
        <SlideOver
          isOpen={isOpen}
          onClose={onClose}
          title={profil?.namaLengkap ?? "Detail Siswa"}
        >
          {kelasSiswa && profil && (
            <div className="flex flex-col gap-6 pb-6">

              {/* ── Avatar + status ────────────────────────────────────────── */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                  {profil.fotoUrl ? (
                    <img
                      src={profil.fotoUrl}
                      alt={profil.namaLengkap}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">
                    {profil.namaLengkap}
                  </p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {profil.nisn ? `NISN: ${profil.nisn}` : "Tanpa NISN"}{" "}
                    · {profil.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
                  </p>
                  <div className="mt-1">
                    <Badge variant={statusConfig[kelasSiswa.status].variant}>
                      {statusConfig[kelasSiswa.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ── Info pribadi ───────────────────────────────────────────── */}
              <Section title="Informasi Pribadi" icon={<User className="h-4 w-4" />}>
                <InfoRow label="TTL" value={`${profil.tempatLahir}, ${formatTanggalSaja(profil.tanggalLahir)}`} />
                <InfoRow label="Agama" value={profil.agama} />
                <InfoRow label="Alamat" value={profil.alamat ?? "—"} />
                {profil.noWa && <InfoRow label="WhatsApp" value={profil.noWa} />}
                <InfoRow
                  label="No. Absen"
                  value={kelasSiswa.nomorAbsen ? String(kelasSiswa.nomorAbsen) : "—"}
                />
                <InfoRow
                  label="Tanggal Masuk"
                  value={formatTanggalSaja(kelasSiswa.tanggalMasuk)}
                />
              </Section>

              {/* ── Orang tua ─────────────────────────────────────────────── */}
              <Section title="Data Orang Tua" icon={<Heart className="h-4 w-4" />}>
                <InfoRow label="Nama Ayah" value={profil.namaAyah ?? "—"} />
                <InfoRow label="Pekerjaan Ayah" value={profil.pekerjaanAyah ?? "—"} />
                <InfoRow label="Nama Ibu" value={profil.namaIbu ?? "—"} />
                <InfoRow label="Pekerjaan Ibu" value={profil.pekerjaanIbu ?? "—"} />
                {profil.namaWali && (
                  <>
                    <InfoRow
                      label="Nama Wali"
                      value={`${profil.namaWali} (${profil.hubunganWali ?? "Wali"})`}
                    />
                    {profil.noTelpWali && (
                      <InfoRow label="Telp Wali" value={profil.noTelpWali} />
                    )}
                  </>
                )}
              </Section>

              {/* ── Absensi ────────────────────────────────────────────────── */}
              <Section title="Rekap Absensi" icon={<Calendar className="h-4 w-4" />}>
                {loadAbsensi ? (
                  <StatsSkeleton count={4} />
                ) : absensi ? (
                  <div className="grid grid-cols-4 gap-2">
                    <AbsensiCard label="Hadir" value={absensi.hadir} color="emerald" />
                    <AbsensiCard label="Sakit" value={absensi.sakit} color="blue" />
                    <AbsensiCard label="Izin" value={absensi.izin} color="yellow" />
                    <AbsensiCard label="Alpa" value={absensi.alpa} color="red" />
                  </div>
                ) : (
                  <Placeholder text="Data absensi belum tersedia" />
                )}
              </Section>

              {/* ── Poin Sikap ─────────────────────────────────────────────── */}
              <Section title="Poin Sikap" icon={<BarChart3 className="h-4 w-4" />}>
                {loadSikap ? (
                  <StatsSkeleton count={3} />
                ) : sikap ? (
                  <div className="grid grid-cols-3 gap-2">
                    <AbsensiCard label="Positif" value={sikap.totalPositif} color="emerald" />
                    <AbsensiCard label="Negatif" value={sikap.totalNegatif} color="red" />
                    <AbsensiCard label="Total Poin" value={sikap.totalPoin} color="blue" />
                  </div>
                ) : (
                  <Placeholder text="Data sikap belum tersedia" />
                )}
              </Section>

              {/* ── Nilai Rapor ────────────────────────────────────────────── */}
              <Section title="Nilai Rapor" icon={<BookOpen className="h-4 w-4" />}>
                {loadNilai ? (
                  <StatsSkeleton count={3} />
                ) : nilaiList.length > 0 ? (
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {nilaiList.map((n, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {n.mataPelajaran}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {n.nilai}
                          </span>
                          <Badge variant="secondary">{n.predikat}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Placeholder text="Belum ada data nilai rapor" />
                )}
              </Section>

              {/* ── Prestasi ───────────────────────────────────────────────── */}
              <Section title="Prestasi" icon={<Award className="h-4 w-4" />}>
                {loadPrestasi ? (
                  <StatsSkeleton count={2} />
                ) : prestasi.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {prestasi.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {p.nama}
                          </p>
                          <Badge variant="secondary">{p.peringkat}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {p.tingkat} · {formatTanggalSaja(p.tanggal)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Placeholder text="Belum ada prestasi tercatat" />
                )}
              </Section>

              {/* ── Ekstrakurikuler (placeholder) ─────────────────────────── */}
              <Section title="Ekstrakurikuler" icon={<CheckCircle2 className="h-4 w-4" />}>
                <Placeholder text="Data ekstrakurikuler belum tersedia (endpoint dalam pengembangan)" />
              </Section>

              {/* ── Action ─────────────────────────────────────────────────── */}
              {kelasSiswa.status === StatusSiswa.AKTIF && (
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  variant="secondary"
                  onClick={() => onMutasi(kelasSiswa)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Mutasi / Ubah Status
                </Button>
              )}
            </div>
          )}
        </SlideOver>
      );
    }

    // ─── Sub-components ───────────────────────────────────────────────────────────

    function Section({
      title,
      icon,
      children,
    }: {
      title: string;
      icon: React.ReactNode;
      children: React.ReactNode;
    }) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-gray-400">{icon}</span>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {title}
            </h3>
          </div>
          {children}
        </div>
      );
    }

    function InfoRow({ label, value }: { label: string; value: string }) {
      return (
        <div className="flex items-start gap-3 py-1.5">
          <span className="text-xs text-gray-400 w-28 shrink-0 pt-0.5">{label}</span>
          <span className="text-sm text-gray-900 dark:text-white">{value}</span>
        </div>
      );
    }

    type AbsensiColor = "emerald" | "blue" | "yellow" | "red";
    const absensiColorMap: Record<AbsensiColor, string> = {
      emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
      blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
      yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
      red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
    };

    function AbsensiCard({
      label,
      value,
      color,
    }: {
      label: string;
      value: number;
      color: AbsensiColor;
    }) {
      return (
        <div
          className={[
            "rounded-xl p-2.5 flex flex-col items-center gap-0.5",
            absensiColorMap[color],
          ].join(" ")}
        >
          <span className="text-lg font-bold">{value}</span>
          <span className="text-xs">{label}</span>
        </div>
      );
    }

    function StatsSkeleton({ count }: { count: number }) {
      return (
        <div className={`grid grid-cols-${count} gap-2`}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      );
    }

    function Placeholder({ text }: { text: string }) {
      return (
        <p className="text-sm text-gray-400 italic py-2">{text}</p>
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
    print("\nBatch 4 selesai - Halaman Kelas Siswa (8 files)")