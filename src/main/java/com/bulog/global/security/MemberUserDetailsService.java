package com.bulog.global.security;

import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.repository.MemberStore;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MemberUserDetailsService implements UserDetailsService {

    private final MemberStore memberStore;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Member member = memberStore.findByEmail(Member.normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("member not found"));
        return MemberPrincipal.from(member);
    }
}
