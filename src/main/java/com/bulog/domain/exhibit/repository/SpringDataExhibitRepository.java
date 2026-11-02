package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import org.springframework.data.jpa.repository.JpaRepository;

interface SpringDataExhibitRepository extends JpaRepository<Exhibit, String> {
}
