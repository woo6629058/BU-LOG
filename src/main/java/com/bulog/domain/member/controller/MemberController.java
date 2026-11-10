package com.bulog.domain.member.controller;

import com.bulog.domain.member.converter.MemberConverter;
import com.bulog.domain.member.dto.req.MemberLoginRequestDTO;
import com.bulog.domain.member.dto.req.MemberSignupRequestDTO;
import com.bulog.domain.member.dto.res.CsrfTokenResponseDTO;
import com.bulog.domain.member.dto.res.MemberResponseDTO;
import com.bulog.domain.member.dto.res.NicknameAvailabilityResponseDTO;
import com.bulog.domain.member.exception.MemberException;
import com.bulog.domain.member.exception.code.MemberErrorCode;
import com.bulog.domain.member.exception.code.MemberSuccessCode;
import com.bulog.domain.member.service.AuthenticatedMember;
import com.bulog.domain.member.service.MemberService;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.service.VisitorCookieManager;
import com.bulog.domain.visitor.service.VisitorRequestFilter;
import com.bulog.domain.visitor.service.VisitorResolution;
import com.bulog.domain.visitor.service.VisitorService;
import com.bulog.global.apiPayload.ApiResponse;
import com.bulog.global.security.MemberPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final VisitorService visitorService;
    private final VisitorCookieManager visitorCookieManager;
    private final SecurityContextRepository securityContextRepository;

    @GetMapping("/csrf")
    public ApiResponse<CsrfTokenResponseDTO> getCsrfToken(CsrfToken csrfToken) {
        return ApiResponse.onSuccess(new CsrfTokenResponseDTO(
                csrfToken.getHeaderName(),
                csrfToken.getParameterName(),
                csrfToken.getToken()
        ));
    }

    @GetMapping("/nickname-availability")
    public ApiResponse<NicknameAvailabilityResponseDTO> checkNickname(@RequestParam String nickname) {
        boolean available = memberService.isNicknameAvailable(nickname);
        return ApiResponse.of(
                MemberSuccessCode.NICKNAME_CHECKED,
                new NicknameAvailabilityResponseDTO(nickname.trim(), available)
        );
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<MemberResponseDTO>> signup(
            @Valid @RequestBody MemberSignupRequestDTO request,
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthenticatedMember authenticatedMember = memberService.signup(request);
        saveAuthentication(authenticatedMember.authentication(), httpRequest, httpResponse);
        linkVisitor(visitor, authenticatedMember, httpResponse);

        return ResponseEntity
                .status(MemberSuccessCode.MEMBER_SIGNED_UP.getHttpStatus())
                .body(ApiResponse.of(
                        MemberSuccessCode.MEMBER_SIGNED_UP,
                        MemberConverter.toResponse(authenticatedMember.member())
                ));
    }

    @PostMapping("/login")
    public ApiResponse<MemberResponseDTO> login(
            @Valid @RequestBody MemberLoginRequestDTO request,
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthenticatedMember authenticatedMember = memberService.login(request);
        saveAuthentication(authenticatedMember.authentication(), httpRequest, httpResponse);
        linkVisitor(visitor, authenticatedMember, httpResponse);
        return ApiResponse.of(
                MemberSuccessCode.MEMBER_LOGGED_IN,
                MemberConverter.toResponse(authenticatedMember.member())
        );
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        VisitorResolution anonymousVisitor = visitorService.createAnonymousVisitor();
        visitorCookieManager.write(response, anonymousVisitor.rawToken());
        return ApiResponse.of(MemberSuccessCode.MEMBER_LOGGED_OUT, null);
    }

    @GetMapping("/me")
    public ApiResponse<MemberResponseDTO> getMe(
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        if (principal == null) {
            throw new MemberException(MemberErrorCode.AUTHENTICATION_REQUIRED);
        }
        return ApiResponse.of(
                MemberSuccessCode.MEMBER_FOUND,
                MemberConverter.toResponse(memberService.getMember(principal.memberId()))
        );
    }

    private void saveAuthentication(
            Authentication authentication,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        request.getSession(true);
        request.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    private void linkVisitor(
            Visitor visitor,
            AuthenticatedMember authenticatedMember,
            HttpServletResponse response
    ) {
        VisitorResolution resolution = visitorService.linkToMember(
                visitor,
                authenticatedMember.member()
        );
        if (resolution.tokenIssued()) {
            visitorCookieManager.write(response, resolution.rawToken());
        }
    }
}
