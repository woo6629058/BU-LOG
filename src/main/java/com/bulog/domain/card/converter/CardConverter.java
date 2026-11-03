package com.bulog.domain.card.converter;

import com.bulog.domain.card.dto.res.ArchiveCardResponseDTO;
import com.bulog.domain.card.dto.res.CardAcquisitionResponseDTO;
import com.bulog.domain.card.dto.res.CardDetailResponseDTO;
import com.bulog.domain.card.entity.CardCollection;
import com.bulog.domain.exhibit.entity.Exhibit;

public final class CardConverter {

    private CardConverter() {
    }

    public static CardAcquisitionResponseDTO toAcquisitionResponse(
            CardCollection card,
            boolean newlyAcquired
    ) {
        return new CardAcquisitionResponseDTO(
                card.getId(),
                card.getExhibitId(),
                newlyAcquired
        );
    }

    public static ArchiveCardResponseDTO toArchiveResponse(
            Exhibit exhibit,
            CardCollection card
    ) {
        return new ArchiveCardResponseDTO(
                card == null ? null : card.getId(),
                exhibit.getId(),
                exhibit.getName(),
                exhibit.getEra(),
                exhibit.getImageUrl(),
                card != null,
                card == null ? null : card.getAcquiredAt()
        );
    }

    public static CardDetailResponseDTO toDetailResponse(
            CardCollection card,
            Exhibit exhibit
    ) {
        return new CardDetailResponseDTO(
                card.getId(),
                exhibit.getId(),
                exhibit.getName(),
                exhibit.getEra(),
                exhibit.getDescription(),
                exhibit.getImageUrl(),
                card.getAcquiredAt()
        );
    }
}
