package com.bulog.domain.halloffame.service;

import com.bulog.domain.card.entity.CardCollection;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import com.bulog.domain.halloffame.dto.res.FinisherResponseDTO;
import com.bulog.domain.halloffame.dto.res.HallOfFameResponseDTO;
import com.bulog.domain.halloffame.dto.res.HallRecordResponseDTO;
import com.bulog.domain.halloffame.entity.Finisher;
import com.bulog.domain.halloffame.entity.HallRecord;
import com.bulog.domain.halloffame.exception.HallOfFameException;
import com.bulog.domain.halloffame.exception.code.HallOfFameErrorCode;
import com.bulog.domain.halloffame.repository.FinisherStore;
import com.bulog.domain.halloffame.repository.HallRecordStore;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.repository.MemberStore;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.service.VisitorService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 명예의 전당: 완주자 명단과 실시간 기록.
 * 카드를 새로 받을 때 CardService가 recordNewCard를 불러 기록을 쌓는다.
 */
@Service
@RequiredArgsConstructor
public class HallOfFameService {

    private final FinisherStore finisherStore;
    private final HallRecordStore hallRecordStore;
    private final ExhibitCatalog exhibitCatalog;
    private final VisitorService visitorService;
    private final MemberStore memberStore;

    /**
     * 새로 받은 카드를 기록한다.
     * 그림 채움은 항상, 전시실 완료는 그 전시실 카드를 모두 모았을 때, 완주는 수집 대상 카드를 모두 모았을 때 남긴다.
     *
     * @param ownerCards 이 사람이 카드를 받기 전에 가지고 있던 카드 (방금 받은 issuedCard는 들어 있지 않고, 판정할 때 따로 더한다)
     */
    @Transactional
    public void recordNewCard(
            Visitor visitor,
            List<Long> ownerVisitorIds,
            Collection<CardCollection> ownerCards,
            CardCollection issuedCard
    ) {
        List<Exhibit> collectibles = exhibitCatalog.findAllCollectible();
        Exhibit exhibit = collectibles.stream()
                .filter(candidate -> candidate.getId().equals(issuedCard.getExhibitId()))
                .findFirst()
                .orElse(null);
        if (exhibit == null) {
            return;
        }

        LocalDateTime acquiredAt = issuedCard.getAcquiredAt();
        String room = exhibit.getExhibitionRoom();
        hallRecordStore.store(HallRecord.fill(visitor, exhibit.getId(), room, acquiredAt));

        Set<String> owned = ownerCards.stream()
                .map(CardCollection::getExhibitId)
                .collect(Collectors.toSet());
        owned.add(issuedCard.getExhibitId());

        if (room != null && collectibles.stream()
                .filter(candidate -> room.equals(candidate.getExhibitionRoom()))
                .allMatch(candidate -> owned.contains(candidate.getId()))) {
            hallRecordStore.store(HallRecord.roomDone(visitor, room, acquiredAt));
        }

        List<CardCollection> allCards = new ArrayList<>(ownerCards);
        allCards.add(issuedCard);
        finishIfComplete(visitor, ownerVisitorIds, allCards, collectibles);
    }

    /**
     * 로그인으로 여러 방문자의 카드가 합쳐졌을 때: 합친 카드가 수집 대상을 모두 채우면 그때 완주 번호를 준다.
     * 이미 완주 번호가 있으면 그대로 둔다.
     *
     * @param ownerCards 이 사람(합쳐진 방문자 전부)이 가진 카드
     */
    @Transactional
    public void finishIfComplete(Visitor visitor, List<Long> ownerVisitorIds, Collection<CardCollection> ownerCards) {
        finishIfComplete(visitor, ownerVisitorIds, ownerCards, exhibitCatalog.findAllCollectible());
    }

    // 완주 시각은 수집 대상 카드 중 마지막으로 받은 시각, 탐험 시간은 첫 카드부터 그때까지
    private void finishIfComplete(
            Visitor visitor,
            List<Long> ownerVisitorIds,
            Collection<CardCollection> ownerCards,
            List<Exhibit> collectibles
    ) {
        Set<String> collectibleIds = collectibles.stream().map(Exhibit::getId).collect(Collectors.toSet());
        // 기기가 합쳐져 같은 유물 카드가 둘 이상이면 먼저 받은 시각만 센다.
        Collection<LocalDateTime> acquiredTimes = ownerCards.stream()
                .filter(card -> collectibleIds.contains(card.getExhibitId()))
                .collect(Collectors.toMap(
                        CardCollection::getExhibitId,
                        CardCollection::getAcquiredAt,
                        (first, second) -> first.isBefore(second) ? first : second
                ))
                .values();
        Set<String> owned = ownerCards.stream().map(CardCollection::getExhibitId).collect(Collectors.toSet());
        if (collectibleIds.isEmpty() || !owned.containsAll(collectibleIds)
                || finisherStore.findFirstByVisitor_IdInOrderByIdAsc(ownerVisitorIds).isPresent()) {
            return;
        }
        LocalDateTime startedAt = acquiredTimes.stream().min(LocalDateTime::compareTo).orElseThrow();
        LocalDateTime finishedAt = acquiredTimes.stream().max(LocalDateTime::compareTo).orElseThrow();
        Finisher finisher = finisherStore.store(Finisher.create(null, visitor, startedAt, finishedAt));
        hallRecordStore.store(HallRecord.finish(finisher));
    }

    @Transactional(readOnly = true)
    public HallOfFameResponseDTO getHallOfFame(Visitor visitor, Long authenticatedMemberId) {
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(visitor, authenticatedMemberId);
        Long myNo = finisherStore.findFirstByVisitor_IdInOrderByIdAsc(ownerVisitorIds)
                .map(Finisher::getId)
                .orElse(null);
        Map<String, String> exhibitNames = exhibitCatalog.findAllCollectible().stream()
                .collect(Collectors.toMap(Exhibit::getId, Exhibit::getName, (first, second) -> first));

        return new HallOfFameResponseDTO(
                finisherStore.count(),
                finisherStore.countByFinishedAtGreaterThanEqual(LocalDate.now().atStartOfDay()),
                myNo,
                myName(visitor, authenticatedMemberId),
                finisherStore.findTop20ByOrderByIdDesc().stream().map(HallOfFameService::toFinisherResponse).toList(),
                hallRecordStore.findTop30ByOrderByIdDesc().stream()
                        .map(record -> toRecordResponse(record, exhibitNames::get))
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public FinisherResponseDTO getFinisher(Long finisherNo) {
        return finisherStore.findById(finisherNo)
                .map(HallOfFameService::toFinisherResponse)
                .orElseThrow(() -> new HallOfFameException(
                        HallOfFameErrorCode.FINISHER_NOT_FOUND,
                        Map.of("no", finisherNo)
                ));
    }

    // 요청의 방문자는 이 트랜잭션 밖에서 읽은 것이라 회원 정보를 따로 찾는다.
    private String myName(Visitor visitor, Long authenticatedMemberId) {
        if (authenticatedMemberId != null) {
            return memberStore.findById(authenticatedMemberId)
                    .map(Member::getNickname)
                    .orElseGet(() -> ExplorerName.guest(visitor.getId()));
        }
        return ExplorerName.guest(visitor.getId());
    }

    private static FinisherResponseDTO toFinisherResponse(Finisher finisher) {
        return new FinisherResponseDTO(
                finisher.getId(),
                ExplorerName.of(finisher.getVisitor()),
                finisher.getFinishedAt(),
                finisher.getDurationSeconds()
        );
    }

    private HallRecordResponseDTO toRecordResponse(HallRecord record, Function<String, String> exhibitNames) {
        String exhibitName = record.getExhibitId() == null ? null : exhibitNames.apply(record.getExhibitId());
        if (exhibitName == null && record.getExhibitId() != null) {
            // 수집 대상에서 빠진 유물이면 이름만 따로 찾는다.
            exhibitName = exhibitCatalog.findById(record.getExhibitId()).map(Exhibit::getName).orElse(null);
        }
        Finisher finisher = record.getFinisher();
        return new HallRecordResponseDTO(
                record.getId(),
                record.getType(),
                ExplorerName.of(record.getVisitor()),
                record.getExhibitId(),
                exhibitName,
                record.getExhibitionRoom(),
                finisher == null ? null : finisher.getId(),
                finisher == null ? null : finisher.getDurationSeconds(),
                record.getOccurredAt()
        );
    }
}
