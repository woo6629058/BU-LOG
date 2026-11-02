package com.bulog.domain.visitor.service;

import com.bulog.domain.member.entity.Member;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.exception.VisitorException;
import com.bulog.domain.visitor.exception.code.VisitorErrorCode;
import com.bulog.domain.visitor.repository.VisitorStore;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VisitorService {

    private final VisitorStore visitorStore;
    private final VisitorTokenService visitorTokenService;

    @Transactional
    public VisitorResolution resolve(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            String tokenHash = visitorTokenService.hash(rawToken);
            return visitorStore.findByTokenHash(tokenHash)
                    .map(visitor -> new VisitorResolution(visitor, rawToken, false))
                    .orElseGet(this::createVisitor);
        }
        return createVisitor();
    }

    @Transactional
    public VisitorResolution linkToMember(Visitor visitor, Member member) {
        if (visitor.isLinkedToAnotherMember(member.getId())) {
            VisitorResolution replacement = createVisitor();
            replacement.visitor().linkMember(member);
            visitorStore.store(replacement.visitor());
            return replacement;
        }

        if (!visitor.isLinkedTo(member.getId())) {
            visitor.linkMember(member);
            visitorStore.store(visitor);
        }
        return new VisitorResolution(visitor, null, false);
    }

    @Transactional
    public VisitorResolution createAnonymousVisitor() {
        return createVisitor();
    }

    @Transactional(readOnly = true)
    public List<Long> getVisitorIds(Visitor currentVisitor, Long authenticatedMemberId) {
        if (authenticatedMemberId == null) {
            return List.of(currentVisitor.getId());
        }
        return visitorStore.findAllByMember_Id(authenticatedMemberId).stream()
                .map(Visitor::getId)
                .toList();
    }

    @Transactional
    public Visitor lockVisitor(Long visitorId) {
        return visitorStore.findByIdForUpdate(visitorId)
                .orElseThrow(() -> new VisitorException(VisitorErrorCode.VISITOR_NOT_FOUND));
    }

    private VisitorResolution createVisitor() {
        String rawToken = visitorTokenService.generate();
        Visitor visitor = Visitor.create(null, visitorTokenService.hash(rawToken));
        return new VisitorResolution(visitorStore.store(visitor), rawToken, true);
    }
}
