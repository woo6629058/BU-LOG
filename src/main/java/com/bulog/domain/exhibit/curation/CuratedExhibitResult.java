package com.bulog.domain.exhibit.curation;

public record CuratedExhibitResult(
        int totalCount,
        int createdCount,
        int updatedCount,
        int releasedCount
) {
}
