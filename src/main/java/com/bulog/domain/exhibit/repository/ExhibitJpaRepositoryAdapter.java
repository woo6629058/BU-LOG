package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!local")
@RequiredArgsConstructor
public class ExhibitJpaRepositoryAdapter implements ExhibitRepository {

    private final SpringDataExhibitRepository springDataExhibitRepository;

    @Override
    public Optional<Exhibit> findById(String exhibitId) {
        return springDataExhibitRepository.findById(exhibitId);
    }
}
