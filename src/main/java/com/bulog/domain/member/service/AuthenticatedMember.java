package com.bulog.domain.member.service;

import com.bulog.domain.member.entity.Member;
import org.springframework.security.core.Authentication;

public record AuthenticatedMember(
        Member member,
        Authentication authentication
) {
}
