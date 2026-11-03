package com.bulog.domain.member.converter;

import com.bulog.domain.member.dto.res.MemberResponseDTO;
import com.bulog.domain.member.entity.Member;

public final class MemberConverter {

    private MemberConverter() {
    }

    public static MemberResponseDTO toResponse(Member member) {
        return new MemberResponseDTO(member.getId(), member.getEmail(), member.getNickname());
    }
}
