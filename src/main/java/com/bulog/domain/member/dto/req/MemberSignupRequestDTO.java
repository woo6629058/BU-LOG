package com.bulog.domain.member.dto.req;

import com.bulog.domain.member.entity.Member;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MemberSignupRequestDTO(
        @NotBlank(message = "이메일은 필수입니다.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email,

        @NotBlank(message = "비밀번호는 필수입니다.")
        @Size(min = 8, max = 64, message = "비밀번호는 8자 이상 64자 이하여야 합니다.")
        String password,

        @NotBlank(message = "닉네임은 필수입니다.")
        @Pattern(regexp = Member.NICKNAME_REGEX, message = "닉네임은 한글·영문·숫자 2~10자로 입력해 주세요.")
        String nickname,

        @AssertTrue(message = "서비스 이용약관에 동의해 주세요.")
        boolean termsAgreed,

        @AssertTrue(message = "개인정보 수집·이용에 동의해 주세요.")
        boolean privacyAgreed,

        boolean marketingAgreed
) {
}
