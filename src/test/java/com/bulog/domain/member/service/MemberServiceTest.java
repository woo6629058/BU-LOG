package com.bulog.domain.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bulog.domain.member.dto.req.MemberSignupRequestDTO;
import com.bulog.domain.member.entity.Member;
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

    private static MemberSignupRequestDTO signupRequest(String email, String nickname) {
        return new MemberSignupRequestDTO(email, "password123!", nickname, true, true, false);
    }

    @Test
    void 회원가입할_때_비밀번호를_암호화한다() {
        AuthenticatedMember result = memberService.signup(signupRequest("Member@Example.com", "부록이"));

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
        memberService.signup(signupRequest("member@example.com", "부록이"));

        assertThatThrownBy(() -> memberService.signup(signupRequest("MEMBER@example.com", "다른이")))
                .isInstanceOf(MemberException.class)
                .hasMessage("이미 사용 중인 이메일입니다.");
    }

    @Test
    void 이미_사용_중인_닉네임으로는_가입할_수_없다() {
        memberService.signup(signupRequest("first@example.com", "Bulog"));

        assertThatThrownBy(() -> memberService.signup(signupRequest("second@example.com", "bulog")))
                .isInstanceOf(MemberException.class)
                .hasMessage("이미 사용 중인 닉네임입니다.");
    }

    @Test
    void 회원가입할_때_약관_동의_시각을_기록한다() {
        Member withoutMarketing = memberService.signup(signupRequest("first@example.com", "첫회원")).member();
        Member withMarketing = memberService.signup(new MemberSignupRequestDTO(
                "second@example.com",
                "password123!",
                "둘회원",
                true,
                true,
                true
        )).member();

        assertThat(withoutMarketing.getTermsAgreedAt()).isNotNull();
        assertThat(withoutMarketing.getPrivacyAgreedAt()).isNotNull();
        assertThat(withoutMarketing.getMarketingAgreedAt()).isNull();
        assertThat(withMarketing.getMarketingAgreedAt()).isNotNull();
    }

    @Test
    void 필수_약관에_동의하지_않으면_가입할_수_없다() {
        assertThatThrownBy(() -> memberService.signup(new MemberSignupRequestDTO(
                "member@example.com",
                "password123!",
                "부록이",
                true,
                false,
                false
        )))
                .isInstanceOf(MemberException.class)
                .hasMessage("필수 약관에 동의해 주세요.");
    }

    @Test
    void 닉네임_사용_가능_여부를_확인한다() {
        memberService.signup(signupRequest("member@example.com", "부록이"));

        assertThat(memberService.isNicknameAvailable("부록이")).isFalse();
        assertThat(memberService.isNicknameAvailable(" 새탐험가 ")).isTrue();
    }

    @Test
    void 규칙에_맞지_않는_닉네임은_확인할_수_없다() {
        assertThatThrownBy(() -> memberService.isNicknameAvailable("가"))
                .isInstanceOf(MemberException.class)
                .hasMessage("닉네임은 한글·영문·숫자 2~10자로 입력해 주세요.");
        assertThatThrownBy(() -> memberService.isNicknameAvailable("열한글자닉네임입니다요"))
                .isInstanceOf(MemberException.class);
        assertThatThrownBy(() -> memberService.isNicknameAvailable("공백 있음"))
                .isInstanceOf(MemberException.class);
    }
}
