package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.Optional;

public interface ExhibitRepository {

    Optional<Exhibit> findById(String exhibitId);
}
