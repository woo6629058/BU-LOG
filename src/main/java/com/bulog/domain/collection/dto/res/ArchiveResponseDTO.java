package com.bulog.domain.collection.dto.res;

import java.util.List;

public record ArchiveResponseDTO(
        long acquiredCount,
        long totalCount,
        List<ArchiveItemResponseDTO> items
) {
}
