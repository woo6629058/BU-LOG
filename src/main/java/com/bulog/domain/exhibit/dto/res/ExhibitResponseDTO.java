package com.bulog.domain.exhibit.dto.res;

public record ExhibitResponseDTO(
        String id,
        String name,
        String era,
        String description,
        String imageUrl,
        String museumName,
        String sourceName,
        String sourceUrl,
        String exhibitionRoom,
        Integer cardNumber,
        Integer visitOrder,
        boolean collectible
) {
}
