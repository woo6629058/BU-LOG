package com.bulog.domain.exhibit.converter;

import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.dto.res.ExhibitListItemResponseDTO;
import com.bulog.domain.exhibit.dto.res.ExhibitListResponseDTO;
import com.bulog.domain.exhibit.entity.Exhibit;
import org.springframework.data.domain.Page;

public final class ExhibitConverter {

    private ExhibitConverter() {
    }

    public static ExhibitResponseDTO toResponse(Exhibit exhibit) {
        return new ExhibitResponseDTO(
                exhibit.getId(),
                exhibit.getName(),
                exhibit.getEra(),
                exhibit.getDescription(),
                exhibit.getImageUrl(),
                exhibit.getMuseumName(),
                exhibit.getSourceName(),
                exhibit.getSourceUrl(),
                exhibit.getExhibitionRoom(),
                exhibit.getCardNumber(),
                exhibit.getVisitOrder(),
                exhibit.isCollectible()
        );
    }

    public static ExhibitListResponseDTO toListResponse(Page<Exhibit> exhibits) {
        return new ExhibitListResponseDTO(
                exhibits.getContent().stream()
                        .map(ExhibitConverter::toListItemResponse)
                        .toList(),
                exhibits.getNumber(),
                exhibits.getSize(),
                exhibits.getTotalElements(),
                exhibits.getTotalPages()
        );
    }

    private static ExhibitListItemResponseDTO toListItemResponse(Exhibit exhibit) {
        return new ExhibitListItemResponseDTO(
                exhibit.getId(),
                exhibit.getName(),
                exhibit.getEra(),
                exhibit.getImageUrl(),
                exhibit.getMuseumName(),
                exhibit.getExhibitionRoom(),
                exhibit.getCardNumber(),
                exhibit.getVisitOrder(),
                exhibit.isCollectible()
        );
    }
}
