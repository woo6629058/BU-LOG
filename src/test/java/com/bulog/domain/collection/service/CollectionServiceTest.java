package com.bulog.domain.collection.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.collection.dto.res.ArchiveItemResponseDTO;
import com.bulog.domain.collection.dto.res.ArchiveResponseDTO;
import com.bulog.domain.collection.dto.res.CollectionAcquisitionResponseDTO;
import com.bulog.domain.collection.exception.CollectionException;
import com.bulog.domain.collection.repository.LocalCollectionRecordRepository;
import com.bulog.domain.exhibit.repository.LocalExhibitRepository;
import com.bulog.domain.halloffame.repository.LocalFinisherRepository;
import com.bulog.domain.halloffame.repository.LocalHallRecordRepository;
import com.bulog.domain.halloffame.service.HallOfFameService;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.repository.LocalMemberRepository;
import com.bulog.domain.visitor.repository.LocalVisitorRepository;
import com.bulog.domain.visitor.service.VisitorResolution;
import com.bulog.domain.visitor.service.VisitorService;
import com.bulog.domain.visitor.service.VisitorTokenService;
import org.junit.jupiter.api.Test;

class CollectionServiceTest {

    private final VisitorService visitorService = new VisitorService(
            new LocalVisitorRepository(),
            new VisitorTokenService()
    );
    private final LocalExhibitRepository exhibitRepository = new LocalExhibitRepository();
    private final HallOfFameService hallOfFameService = new HallOfFameService(
            new LocalFinisherRepository(),
            new LocalHallRecordRepository(),
            exhibitRepository,
            visitorService,
            new LocalMemberRepository()
    );
    private final CollectionService collectionService = new CollectionService(
            new LocalCollectionRecordRepository(),
            exhibitRepository,
            visitorService,
            hallOfFameService
    );

    @Test
    void 같은_방문자에게_같은_유물을_중복_수집하지_않는다() {
        VisitorResolution guest = visitorService.resolve(null);

        CollectionAcquisitionResponseDTO first = collectionService.collect(
                guest.visitor(),
                null,
                "ongi1-faith-jar"
        );
        CollectionAcquisitionResponseDTO second = collectionService.collect(
                guest.visitor(),
                null,
                "ongi1-faith-jar"
        );

        assertThat(first.newlyAcquired()).isTrue();
        assertThat(second.newlyAcquired()).isFalse();
        assertThat(second.recordId()).isEqualTo(first.recordId());
    }

    @Test
    void 로그인한_회원의_여러_방문자_기록을_하나의_아카이브로_조회한다() {
        VisitorResolution firstGuest = visitorService.resolve(null);
        VisitorResolution secondGuest = visitorService.resolve(null);
        Member member = Member.create(1L, "member@example.com", "encoded", "부록이");
        visitorService.linkToMember(firstGuest.visitor(), member);
        visitorService.linkToMember(secondGuest.visitor(), member);

        CollectionAcquisitionResponseDTO first = collectionService.collect(
                firstGuest.visitor(),
                member.getId(),
                "ongi1-faith-jar"
        );
        CollectionAcquisitionResponseDTO duplicate = collectionService.collect(
                secondGuest.visitor(),
                member.getId(),
                "ongi1-faith-jar"
        );
        ArchiveResponseDTO archive = collectionService.getArchive(
                secondGuest.visitor(),
                member.getId()
        );

        assertThat(duplicate.newlyAcquired()).isFalse();
        assertThat(duplicate.recordId()).isEqualTo(first.recordId());
        assertThat(archive.acquiredCount()).isEqualTo(1);
        assertThat(archive.totalCount()).isEqualTo(24);
        assertThat(archive.items()).filteredOn(ArchiveItemResponseDTO::acquired).singleElement().satisfies(collected -> {
            assertThat(collected.recordId()).isEqualTo(first.recordId());
            assertThat(collected.exhibitId()).isEqualTo("ongi1-faith-jar");
            assertThat(collected.exhibitionRoom()).isEqualTo("옹기1전시실");
            assertThat(collected.exhibitNumber()).isEqualTo(1);
            assertThat(collected.description()).isNotBlank();
        });
    }

    @Test
    void 다른_방문자의_수집_기록은_조회할_수_없다() {
        VisitorResolution owner = visitorService.resolve(null);
        VisitorResolution other = visitorService.resolve(null);
        CollectionAcquisitionResponseDTO issued = collectionService.collect(
                owner.visitor(),
                null,
                "ongi1-faith-jar"
        );

        assertThatThrownBy(() -> collectionService.getRecord(issued.recordId(), other.visitor(), null))
                .isInstanceOf(CollectionException.class)
                .hasMessage("수집 기록을 찾을 수 없습니다.");
    }
}
