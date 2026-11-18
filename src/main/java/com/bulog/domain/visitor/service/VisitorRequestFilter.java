package com.bulog.domain.visitor.service;

import com.bulog.domain.member.repository.MemberStore;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.global.security.MemberPrincipal;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class VisitorRequestFilter extends OncePerRequestFilter {

    public static final String VISITOR_ATTRIBUTE = "BU_LOG_VISITOR_CONTEXT";

    private final VisitorService visitorService;
    private final VisitorCookieManager visitorCookieManager;
    private final MemberStore memberStore;
    private final HandlerExceptionResolver handlerExceptionResolver;

    public VisitorRequestFilter(
            VisitorService visitorService,
            VisitorCookieManager visitorCookieManager,
            MemberStore memberStore,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver handlerExceptionResolver
    ) {
        this.visitorService = visitorService;
        this.visitorCookieManager = visitorCookieManager;
        this.memberStore = memberStore;
        this.handlerExceptionResolver = handlerExceptionResolver;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Visitor visitor;
        try {
            VisitorResolution resolution = visitorService.resolve(visitorCookieManager.read(request));
            if (resolution.tokenIssued()) {
                visitorCookieManager.write(response, resolution.rawToken());
            }
            visitor = linkAuthenticatedMember(resolution.visitor(), response);
        } catch (Exception exception) {
            handlerExceptionResolver.resolveException(request, response, null, exception);
            return;
        }
        request.setAttribute(VISITOR_ATTRIBUTE, visitor);
        filterChain.doFilter(request, response);
    }

    private Visitor linkAuthenticatedMember(
            Visitor visitor,
            HttpServletResponse response
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof MemberPrincipal principal)) {
            // 로그인이 풀렸는데(세션 만료·브라우저 재시작) 방문자는 계정에 이어져 있으면,
            // 로그아웃할 때처럼 새 게스트로 시작한다. 그대로 두면 게스트 화면에서 모은 기록이 그 계정 이름으로 남는다.
            // 계정에 남은 기록은 다시 로그인하면 이 새 게스트 기록과 함께 합쳐진다.
            if (visitor.getMember() != null) {
                VisitorResolution anonymous = visitorService.createAnonymousVisitor();
                visitorCookieManager.write(response, anonymous.rawToken());
                return anonymous.visitor();
            }
            return visitor;
        }

        return memberStore.findById(principal.memberId())
                .map(member -> {
                    VisitorResolution linked = visitorService.linkToMember(visitor, member);
                    if (linked.tokenIssued()) {
                        visitorCookieManager.write(response, linked.rawToken());
                    }
                    return linked.visitor();
                })
                .orElse(visitor);
    }
}
