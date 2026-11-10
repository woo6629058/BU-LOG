package com.bulog.domain.member.service;

import com.bulog.domain.member.dto.req.MemberLoginRequestDTO;
import com.bulog.domain.member.dto.req.MemberSignupRequestDTO;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.exception.MemberException;
import com.bulog.domain.member.exception.code.MemberErrorCode;
import com.bulog.domain.member.repository.MemberStore;
import com.bulog.global.security.MemberPrincipal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberStore memberStore;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthenticatedMember signup(MemberSignupRequestDTO request) {
        if (!request.termsAgreed() || !request.privacyAgreed()) {
            // DTO 검증을 거치지 않고 호출되는 경우를 대비해 서비스에서도 필수 동의를 확인한다.
            throw new MemberException(MemberErrorCode.REQUIRED_AGREEMENT_MISSING);
        }
        String email = Member.normalizeEmail(request.email());
        String nickname = Member.normalizeNickname(request.nickname());
        if (memberStore.existsByEmail(email)) {
            throw new MemberException(MemberErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (memberStore.existsByNickname(nickname)) {
            throw new MemberException(MemberErrorCode.NICKNAME_ALREADY_EXISTS);
        }

        Member member;
        try {
            member = memberStore.store(Member.signUp(
                    email,
                    passwordEncoder.encode(request.password()),
                    nickname,
                    LocalDateTime.now(),
                    request.marketingAgreed()
            ));
        } catch (DataIntegrityViolationException exception) {
            // 확인과 저장 사이에 같은 이메일·닉네임으로 먼저 가입된 경우 (unique 제약 위반)
            throw new MemberException(MemberErrorCode.MEMBER_ALREADY_EXISTS);
        }
        MemberPrincipal principal = MemberPrincipal.from(member);
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                principal.getAuthorities()
        );
        return new AuthenticatedMember(member, authentication);
    }

    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        if (!Member.isValidNickname(nickname)) {
            throw new MemberException(MemberErrorCode.INVALID_NICKNAME);
        }
        return !memberStore.existsByNickname(Member.normalizeNickname(nickname));
    }

    @Transactional(readOnly = true)
    public AuthenticatedMember login(MemberLoginRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(
                            Member.normalizeEmail(request.email()),
                            request.password()
                    )
            );
            MemberPrincipal principal = (MemberPrincipal) authentication.getPrincipal();
            Member member = memberStore.findByEmail(principal.email())
                    .orElseThrow(() -> new MemberException(MemberErrorCode.MEMBER_NOT_FOUND));
            return new AuthenticatedMember(member, authentication);
        } catch (AuthenticationException exception) {
            throw new MemberException(MemberErrorCode.LOGIN_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public Member getMember(Long memberId) {
        if (memberId == null) {
            throw new MemberException(MemberErrorCode.AUTHENTICATION_REQUIRED);
        }
        return memberStore.findById(memberId)
                .orElseThrow(() -> new MemberException(MemberErrorCode.MEMBER_NOT_FOUND));
    }
}
