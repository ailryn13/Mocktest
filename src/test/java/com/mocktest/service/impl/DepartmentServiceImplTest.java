package com.mocktest.service.impl;

import com.mocktest.dto.department.DepartmentRequest;
import com.mocktest.dto.department.DepartmentResponse;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.models.Department;
import com.mocktest.repositories.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class DepartmentServiceImplTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

    private Department testDepartment;

    @BeforeEach
    void setUp() {
        testDepartment = new Department("Computer Science");
        testDepartment.setId(1L);
    }

    @Test
    void create_withValidRequest_returnsDepartmentResponse() {
        // Arrange
        DepartmentRequest request = new DepartmentRequest("Mathematics");
        Department saved = new Department("Mathematics");
        saved.setId(2L);

        when(departmentRepository.findByName("Mathematics")).thenReturn(Optional.empty());
        when(departmentRepository.save(any(Department.class))).thenReturn(saved);

        // Act
        DepartmentResponse response = departmentService.create(request);

        // Assert
        assertEquals(2L, response.getId());
        assertEquals("Mathematics", response.getName());
    }

    @Test
    void create_withExistingName_throwsBadRequestException() {
        // Arrange
        DepartmentRequest request = new DepartmentRequest("Computer Science");
        when(departmentRepository.findByName("Computer Science")).thenReturn(Optional.of(testDepartment));

        // Act & Assert
        assertThrows(BadRequestException.class, () -> departmentService.create(request));
        verify(departmentRepository, never()).save(any());
    }

    @Test
    void getAll_returnsList() {
        // Arrange
        Department dept2 = new Department("Mathematics");
        dept2.setId(2L);
        when(departmentRepository.findAll()).thenReturn(Arrays.asList(testDepartment, dept2));

        // Act
        List<DepartmentResponse> result = departmentService.getAll();

        // Assert
        assertEquals(2, result.size());
        assertEquals("Computer Science", result.get(0).getName());
        assertEquals("Mathematics", result.get(1).getName());
    }

    @Test
    void getById_withValidId_returnsDepartment() {
        // Arrange
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(testDepartment));

        // Act
        DepartmentResponse response = departmentService.getById(1L);

        // Assert
        assertEquals(1L, response.getId());
        assertEquals("Computer Science", response.getName());
    }

    @Test
    void getById_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        when(departmentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> departmentService.getById(999L));
    }

    @Test
    void update_withValidId_returnsUpdatedDepartment() {
        // Arrange
        DepartmentRequest request = new DepartmentRequest("Updated Name");
        Department updated = new Department("Updated Name");
        updated.setId(1L);

        when(departmentRepository.findById(1L)).thenReturn(Optional.of(testDepartment));
        when(departmentRepository.save(any(Department.class))).thenReturn(updated);

        // Act
        DepartmentResponse response = departmentService.update(1L, request);

        // Assert
        assertEquals("Updated Name", response.getName());
    }

    @Test
    void update_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        DepartmentRequest request = new DepartmentRequest("Name");
        when(departmentRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> departmentService.update(999L, request));
    }

    @Test
    void delete_withValidId_deletesSuccessfully() {
        // Arrange
        when(departmentRepository.existsById(1L)).thenReturn(true);

        // Act
        departmentService.delete(1L);

        // Assert
        verify(departmentRepository).deleteById(1L);
    }

    @Test
    void delete_withInvalidId_throwsResourceNotFoundException() {
        // Arrange
        when(departmentRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> departmentService.delete(999L));
    }
}
