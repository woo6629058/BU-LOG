package com.bulog.domain.card.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.card.dto.res.ArchiveResponseDTO;
import com.bulog.domain.card.dto.res.CardAcquisitionResponseDTO;
import com.bulog.domain.card.exception.CardException;
import com.bulog.domain.card.repository.LocalCardCollectionRepository;
import com.bulog.domain.exhibit.repository.LocalExhibitRepository;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.visitor.repository.LocalVisitorRepository;
import com.bulog.domain.visitor.service.VisitorResolution;
import com.bulog.domain.visitor.service.VisitorService;
import com.bulog.domain.visitor.service.VisitorTokenService;
import org.junit.jupiter.api.Test;

class CardServiceTest {

    private final VisitorService visitorService = new VisitorService(
            new LocalVisitorRepository(),
            new VisitorTokenService()
    );
    private final CardService cardService = new CardService(
            new LocalCardCollectionRepository(),
            new LocalExhibitRepository(),
            visitorService
    );

    @Test
    void 같은_방문자에게_같은_카드를_중복_발급하지_않는다() {
        VisitorResolution guest = visitorService.resolve(null);

        CardAcquisitionResponseDTO first = cardService.issueCard(
                guest.visitor(),
                null,
                "goryeo-celadon"
        );
        CardAcquisitionResponseDTO second = cardService.issueCard(
                guest.visitor(),
                null,
                "goryeo-celadon"
        );

        assertThat(first.newlyAcquired()).isTrue();
        assertThat(second.newlyAcquired()).isFalse();
        assertThat(second.cardId()).isEqualTo(first.cardId());
    }

    @Test
    void 로그인한_회원의_여러_방문자_기록을_하나의_아카이브로_조회한다() {
        VisitorResolution firstGuest = visitorService.resolve(null);
        VisitorResolution secondGuest = visitorService.resolve(null);
        Member member = Member.create(1L, "member@example.com", "encoded", "부록이");
        visitorService.linkToMember(firstGuest.visitor(), member);
        visitorService.linkToMember(secondGuest.visitor(), member);

        CardAcquisitionResponseDTO first = cardService.issueCard(
                firstGuest.visitor(),
                member.getId(),
                "goryeo-celadon"
        );
        CardAcquisitionResponseDTO duplicate = cardService.issueCard(
                secondGuest.visitor(),
                member.getId(),
                "goryeo-celadon"
        );
        ArchiveResponseDTO archive = cardService.getArchive(
                secondGuest.visitor(),
                member.getId()
        );

        assertThat(duplicate.newlyAcquired()).isFalse();
        assertThat(duplicate.cardId()).isEqualTo(first.cardId());
        assertThat(archive.acquiredCount()).isEqualTo(1);
        assertThat(archive.cards()).singleElement().satisfies(card -> {
            assertThat(card.acquired()).isTrue();
            assertThat(card.cardId()).isEqualTo(first.cardId());
        });
    }

    @Test
    void 다른_방문자의_카드_상세는_조회할_수_없다() {
        VisitorResolution owner = visitorService.resolve(null);
        VisitorResolution other = visitorService.resolve(null);
        CardAcquisitionResponseDTO issued = cardService.issueCard(
                owner.visitor(),
                null,
                "goryeo-celadon"
        );

        assertThatThrownBy(() -> cardService.getCard(issued.cardId(), other.visitor(), null))
                .isInstanceOf(CardException.class)
                .hasMessage("카드를 찾을 수 없습니다.");
    }
}
