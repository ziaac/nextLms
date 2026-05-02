export const kurikulumKeys = {
  all:       ['kurikulum'] as const,
  lists:     () => [...kurikulumKeys.all, 'list'] as const,
  aktif:     () => [...kurikulumKeys.all, 'aktif'] as const,
  detail:    (id: string) => [...kurikulumKeys.all, id] as const,
  formatBaku:(id: string) => [...kurikulumKeys.all, id, 'format-baku'] as const,
}
