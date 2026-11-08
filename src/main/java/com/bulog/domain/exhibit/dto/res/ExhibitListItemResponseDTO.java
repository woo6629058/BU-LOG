package com.bulog.domain.exhibit.dto.res;

public record ExhibitListItemResponseDTO(
        String id,
        String name,
        String era,
        String imageUrl,
        String museumName,
        String exhibitionRoom,
        Integer cardNumber,
        Integer visitOrder,
        boolean collectible
) {
}
