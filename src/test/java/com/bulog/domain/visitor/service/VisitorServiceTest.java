package com.bulog.domain.visitor.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bulog.domain.member.entity.Member;
import com.bulog.domain.visitor.repository.LocalVisitorRepository;
import org.junit.jupiter.api.Test;

class VisitorServiceTest {

    private final VisitorService visitorService = new VisitorService(
            new LocalVisitorRepository(),
            new VisitorTokenService()
    );

    @Test
    void 첫_방문이면_예측하기_어려운_토큰과_방문자를_생성한다() {
        VisitorResolution resolution = visitorService.resolve(null);

        assertThat(resolution.tokenIssued()).isTrue();
        assertThat(resolution.rawToken()).hasSizeGreaterThanOrEqualTo(40);
        assertThat(resolution.visitor().getTokenHash()).hasSize(64);
        assertThat(resolution.visitor().getTokenHash()).isNotEqualTo(resolution.rawToken());
    }

    @Test
    void 같은_토큰으로_재방문하면_기존_방문자를_사용한다() {
        VisitorResolution firstVisit = visitorService.resolve(null);
        VisitorResolution revisit = visitorService.resolve(firstVisit.rawToken());

        assertThat(revisit.tokenIssued()).isFalse();
        assertThat(revisit.visitor().getId()).isEqualTo(firstVisit.visitor().getId());
    }

    @Test
    void 로그인하면_현재_게스트_방문자를_회원에게_연결한다() {
        VisitorResolution guest = visitorService.resolve(null);
        Member member = Member.create(1L, "member@example.com", "encoded", "부록이");

        VisitorResolution linked = visitorService.linkToMember(guest.visitor(), member);

        assertThat(linked.visitor().isLinkedTo(member.getId())).isTrue();
        assertThat(linked.tokenIssued()).isFalse();
    }

    @Test
    void 다른_회원과_연결된_브라우저에서는_새_방문자를_발급한다() {
        VisitorResolution guest = visitorService.resolve(null);
        Member firstMember = Member.create(1L, "first@example.com", "encoded", "첫회원");
        Member secondMember = Member.create(2L, "second@example.com", "encoded", "둘회원");
        visitorService.linkToMember(guest.visitor(), firstMember);

        VisitorResolution replaced = visitorService.linkToMember(guest.visitor(), secondMember);

        assertThat(replaced.tokenIssued()).isTrue();
        assertThat(replaced.visitor().getId()).isNotEqualTo(guest.visitor().getId());
        assertThat(replaced.visitor().isLinkedTo(secondMember.getId())).isTrue();
    }
}
