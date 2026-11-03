package com.bulog.domain.member.service;

import com.bulog.domain.member.dto.req.MemberLoginRequestDTO;
import com.bulog.domain.member.dto.req.MemberSignupRequestDTO;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.exception.MemberException;
import com.bulog.domain.member.exception.code.MemberErrorCode;
import com.bulog.domain.member.repository.MemberStore;
import com.bulog.global.security.MemberPrincipal;
import lombok.RequiredArgsConstructor;
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
        String email = Member.normalizeEmail(request.email());
        if (memberStore.existsByEmail(email)) {
            throw new MemberException(MemberErrorCode.EMAIL_ALREADY_EXISTS);
        }

        Member member = memberStore.store(Member.create(
                null,
                email,
                passwordEncoder.encode(request.password()),
                request.nickname()
        ));
        MemberPrincipal principal = MemberPrincipal.from(member);
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                principal,
                null,
                principal.getAuthorities()
        );
        return new AuthenticatedMember(member, authentication);
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
