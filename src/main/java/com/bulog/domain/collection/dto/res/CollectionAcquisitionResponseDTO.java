package com.bulog.domain.collection.dto.res;

public record CollectionAcquisitionResponseDTO(
        Long recordId,
        String exhibitId,
        boolean newlyAcquired
) {
}
