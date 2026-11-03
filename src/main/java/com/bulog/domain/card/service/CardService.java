package com.bulog.domain.card.service;

import com.bulog.domain.card.converter.CardConverter;
import com.bulog.domain.card.dto.res.ArchiveCardResponseDTO;
import com.bulog.domain.card.dto.res.ArchiveResponseDTO;
import com.bulog.domain.card.dto.res.CardAcquisitionResponseDTO;
import com.bulog.domain.card.dto.res.CardDetailResponseDTO;
import com.bulog.domain.card.entity.CardCollection;
import com.bulog.domain.card.exception.CardException;
import com.bulog.domain.card.exception.code.CardErrorCode;
import com.bulog.domain.card.repository.CardCollectionStore;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.service.VisitorService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardCollectionStore cardCollectionStore;
    private final ExhibitCatalog exhibitCatalog;
    private final VisitorService visitorService;

    @Transactional
    public CardAcquisitionResponseDTO issueCard(
            Visitor visitor,
            Long authenticatedMemberId,
            String exhibitId
    ) {
        Visitor lockedVisitor = visitorService.lockVisitor(visitor.getId());
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(
                lockedVisitor,
                authenticatedMemberId
        );
        CardCollection existingCard = cardCollectionStore
                .findAllByVisitor_IdIn(ownerVisitorIds)
                .stream()
                .filter(card -> card.getExhibitId().equals(exhibitId))
                .min(Comparator.comparing(CardCollection::getAcquiredAt))
                .orElse(null);

        if (existingCard != null) {
            return CardConverter.toAcquisitionResponse(existingCard, false);
        }

        CardCollection issuedCard = cardCollectionStore.store(CardCollection.create(
                null,
                lockedVisitor,
                exhibitId,
                LocalDateTime.now()
        ));
        return CardConverter.toAcquisitionResponse(issuedCard, true);
    }

    @Transactional(readOnly = true)
    public ArchiveResponseDTO getArchive(Visitor visitor, Long authenticatedMemberId) {
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(
                visitor,
                authenticatedMemberId
        );
        Map<String, CardCollection> acquiredCards = cardCollectionStore
                .findAllByVisitor_IdIn(ownerVisitorIds)
                .stream()
                .collect(Collectors.toMap(
                        CardCollection::getExhibitId,
                        Function.identity(),
                        CardService::earlierCard,
                        LinkedHashMap::new
                ));

        List<Exhibit> exhibits = exhibitCatalog.findAll();
        List<ArchiveCardResponseDTO> archiveCards = exhibits.stream()
                .map(exhibit -> CardConverter.toArchiveResponse(
                        exhibit,
                        acquiredCards.get(exhibit.getId())
                ))
                .toList();
        return new ArchiveResponseDTO(
                archiveCards.stream().filter(ArchiveCardResponseDTO::acquired).count(),
                exhibits.size(),
                archiveCards
        );
    }

    @Transactional(readOnly = true)
    public CardDetailResponseDTO getCard(
            Long cardId,
            Visitor visitor,
            Long authenticatedMemberId
    ) {
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(
                visitor,
                authenticatedMemberId
        );
        CardCollection card = cardCollectionStore.findById(cardId)
                .filter(foundCard -> ownerVisitorIds.contains(foundCard.getVisitor().getId()))
                .orElseThrow(() -> new CardException(
                        CardErrorCode.CARD_NOT_FOUND,
                        Map.of("cardId", cardId)
                ));
        Exhibit exhibit = exhibitCatalog.findById(card.getExhibitId())
                .orElseThrow(() -> new CardException(
                        CardErrorCode.CARD_NOT_FOUND,
                        Map.of("cardId", cardId)
                ));
        return CardConverter.toDetailResponse(card, exhibit);
    }

    private static CardCollection earlierCard(CardCollection first, CardCollection second) {
        return first.getAcquiredAt().isBefore(second.getAcquiredAt()) ? first : second;
    }
}
