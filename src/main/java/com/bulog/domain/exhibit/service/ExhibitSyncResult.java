package com.bulog.domain.exhibit.service;

public record ExhibitSyncResult(
        long totalCount,
        int processedCount,
        int createdCount,
        int updatedCount
) {
}
