package com.bulog.domain.exhibit.dto.res;

import java.util.List;

public record ExhibitListResponseDTO(
        List<ExhibitListItemResponseDTO> exhibits,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
