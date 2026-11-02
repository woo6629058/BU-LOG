package com.bulog.domain.exhibit.converter;

import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.entity.Exhibit;

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
                exhibit.getSourceUrl()
        );
    }
}
