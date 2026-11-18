package com.bulog.domain.halloffame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.card.repository.LocalCardCollectionRepository;
import com.bulog.domain.card.service.CardService;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.LocalExhibitRepository;
import com.bulog.domain.halloffame.dto.res.HallOfFameResponseDTO;
import com.bulog.domain.halloffame.dto.res.HallRecordResponseDTO;
import com.bulog.domain.halloffame.entity.HallRecordType;
import com.bulog.domain.halloffame.exception.HallOfFameException;
import com.bulog.domain.halloffame.repository.LocalFinisherRepository;
import com.bulog.domain.halloffame.repository.LocalHallRecordRepository;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.repository.LocalMemberRepository;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.repository.LocalVisitorRepository;
import com.bulog.domain.visitor.service.VisitorService;
import com.bulog.domain.visitor.service.VisitorTokenService;
import java.util.List;
import org.junit.jupiter.api.Test;

class HallOfFameServiceTest {

    private final LocalExhibitRepository exhibitRepository = new LocalExhibitRepository();
    private final LocalMemberRepository memberRepository = new LocalMemberRepository();
    private final VisitorService visitorService = new VisitorService(
            new LocalVisitorRepository(),
            new VisitorTokenService()
    );
    private final HallOfFameService hallOfFameService = new HallOfFameService(
            new LocalFinisherRepository(),
            new LocalHallRecordRepository(),
            exhibitRepository,
            visitorService,
            memberRepository
    );
    private final CardService cardService = new CardService(
            new LocalCardCollectionRepository(),
            exhibitRepository,
            visitorService,
            hallOfFameService
    );
    private final List<Exhibit> collectibles = exhibitRepository.findAllCollectible();

    @Test
    void 카드를_모두_모으면_완주_번호를_받는다() {
        Visitor guest = visitorService.resolve(null).visitor();

        collectibles.forEach(exhibit -> cardService.issueCard(guest, null, exhibit.getId()));

        HallOfFameResponseDTO hall = hallOfFameService.getHallOfFame(guest, null);
        assertThat(hall.total()).isEqualTo(1);
        assertThat(hall.today()).isEqualTo(1);
        assertThat(hall.myNo()).isEqualTo(1L);
        assertThat(hall.finishers()).singleElement()
                .satisfies(finisher -> assertThat(finisher.name()).startsWith("게스트 "));
        assertThat(hall.records().getFirst().type()).isEqualTo(HallRecordType.FINISH);
        assertThat(hall.records().getFirst().finisherNo()).isEqualTo(1L);
    }

    @Test
    void 전시실_카드를_모두_모으면_전시실_완료_기록이_남는다() {
        Visitor guest = visitorService.resolve(null).visitor();
        String room = collectibles.getFirst().getExhibitionRoom();
        List<Exhibit> roomExhibits = collectibles.stream()
                .filter(exhibit -> room.equals(exhibit.getExhibitionRoom()))
                .toList();

        roomExhibits.forEach(exhibit -> cardService.issueCard(guest, null, exhibit.getId()));
        // 이미 받은 카드를 다시 받아도 기록은 늘지 않는다.
        cardService.issueCard(guest, null, roomExhibits.getFirst().getId());

        List<HallRecordResponseDTO> records = hallOfFameService.getHallOfFame(guest, null).records();
        assertThat(records).hasSize(roomExhibits.size() + 1);
        assertThat(records.getFirst().type()).isEqualTo(HallRecordType.ROOM_DONE);
        assertThat(records.getFirst().exhibitionRoom()).isEqualTo(room);
        assertThat(records.get(1).type()).isEqualTo(HallRecordType.FILL);
        assertThat(records.get(1).exhibitName()).isEqualTo(roomExhibits.getLast().getName());
    }

    @Test
    void 아직_완주하지_않았으면_내_번호가_없다() {
        Visitor guest = visitorService.resolve(null).visitor();
        cardService.issueCard(guest, null, collectibles.getFirst().getId());

        HallOfFameResponseDTO hall = hallOfFameService.getHallOfFame(guest, null);
        assertThat(hall.total()).isZero();
        assertThat(hall.myNo()).isNull();
        assertThat(hall.finishers()).isEmpty();
    }

    @Test
    void 로그인한_회원은_닉네임으로_보이고_여러_방문자의_카드를_합쳐_완주한다() {
        Member member = memberRepository.store(Member.create(1L, "member@example.com", "encoded", "부록이"));
        Visitor phone = visitorService.resolve(null).visitor();
        Visitor tablet = visitorService.resolve(null).visitor();
        visitorService.linkToMember(phone, member);
        visitorService.linkToMember(tablet, member);

        List<Exhibit> half = collectibles.subList(0, collectibles.size() / 2);
        List<Exhibit> rest = collectibles.subList(collectibles.size() / 2, collectibles.size());
        half.forEach(exhibit -> cardService.issueCard(phone, member.getId(), exhibit.getId()));
        rest.forEach(exhibit -> cardService.issueCard(tablet, member.getId(), exhibit.getId()));

        HallOfFameResponseDTO hall = hallOfFameService.getHallOfFame(phone, member.getId());
        assertThat(hall.myNo()).isEqualTo(1L);
        assertThat(hall.finishers()).singleElement()
                .satisfies(finisher -> assertThat(finisher.name()).isEqualTo("부록이"));
        assertThat(hall.myName()).isEqualTo("부록이");
    }

    @Test
    void 없는_완주_번호는_찾을_수_없다() {
        assertThatThrownBy(() -> hallOfFameService.getFinisher(99L))
                .isInstanceOf(HallOfFameException.class);
    }

    @Test
    void 게스트_번호는_네_자리이고_방문자마다_다르다() {
        assertThat(ExplorerName.guestNumber(1L)).isEqualTo("7919");
        assertThat(ExplorerName.guestNumber(2L)).isEqualTo("5838");
        assertThat(ExplorerName.guestNumber(10_000L)).isEqualTo("0000");
    }
}
