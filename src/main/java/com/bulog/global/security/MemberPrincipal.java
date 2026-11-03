package com.bulog.global.security;

import com.bulog.domain.member.entity.Member;
import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public record MemberPrincipal(
        Long memberId,
        String email,
        String password,
        String nickname
) implements UserDetails, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    public static MemberPrincipal from(Member member) {
        return new MemberPrincipal(
                member.getId(),
                member.getEmail(),
                member.getPasswordHash(),
                member.getNickname()
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public String getPassword() {
        return password;
    }
}
