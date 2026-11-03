package com.bulog.domain.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.member.dto.req.MemberSignupRequestDTO;
import com.bulog.domain.member.exception.MemberException;
import com.bulog.domain.member.repository.LocalMemberRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class MemberServiceTest {

    private final LocalMemberRepository memberRepository = new LocalMemberRepository();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final MemberService memberService = new MemberService(
            memberRepository,
            passwordEncoder,
            authentication -> authentication
    );

    @Test
    void 회원가입할_때_비밀번호를_암호화한다() {
        AuthenticatedMember result = memberService.signup(new MemberSignupRequestDTO(
                "Member@Example.com",
                "password123!",
                "부록이"
        ));

        assertThat(result.member().getEmail()).isEqualTo("member@example.com");
        assertThat(result.member().getPasswordHash()).isNotEqualTo("password123!");
        assertThat(passwordEncoder.matches(
                "password123!",
                result.member().getPasswordHash()
        )).isTrue();
        assertThat(result.authentication().isAuthenticated()).isTrue();
    }

    @Test
    void 이미_가입된_이메일은_대소문자가_달라도_다시_가입할_수_없다() {
        memberService.signup(new MemberSignupRequestDTO(
                "member@example.com",
                "password123!",
                "부록이"
        ));

        assertThatThrownBy(() -> memberService.signup(new MemberSignupRequestDTO(
                "MEMBER@example.com",
                "password456!",
                "다른이"
        )))
                .isInstanceOf(MemberException.class)
                .hasMessage("이미 사용 중인 이메일입니다.");
    }
}
