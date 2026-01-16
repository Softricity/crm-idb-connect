"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { LeadsAPI, ApplicationsAPI, CountriesAPI, UniversitiesAPI, CoursesAPI } from "@/lib/api";

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Country {
  id: string;
  name: string;
}

interface University {
  id: string;
  name: string;
  countryId: string;
}

interface Course {
  id: string;
  name: string;
  universityId: string;
  level?: string;
  category?: string;
}

const CreateApplicationModal: React.FC<CreateApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [preferredCourse, setPreferredCourse] = useState("");
  const [preferredCountry, setPreferredCountry] = useState("");
  const [preferredUniversity, setPreferredUniversity] = useState("");

  // Fetch countries and universities on mount
  useEffect(() => {
    if (isOpen) {
      fetchCountries();
      fetchUniversities();
      fetchCourses();
    }
  }, [isOpen]);

  // Filter universities based on selected country
  useEffect(() => {
    if (preferredCountry) {
      const filtered = universities.filter(
        (uni) => (uni as any).country.name === preferredCountry
      );
      setFilteredUniversities(filtered);
      // Reset university selection if it's not in the filtered list
      if (preferredUniversity && !filtered.find((u) => (u as any).name === preferredUniversity)) {
        setPreferredUniversity("");
      }
    } else {
      setFilteredUniversities(universities);
    }
  }, [preferredCountry, universities, preferredUniversity]);

  // Filter courses based on selected university
  useEffect(() => {
    if (preferredUniversity) {
      const selectedUni = universities.find((u) => (u as any).name === preferredUniversity);
      if (selectedUni) {
        const filtered = courses.filter(
          (course) => (course as any).universityId === selectedUni.id
        );
        setFilteredCourses(filtered);
        // Reset course selection if it's not in the filtered list
        if (preferredCourse && !filtered.find((c) => c.name === preferredCourse)) {
          setPreferredCourse("");
        }
      }
    } else {
      setFilteredCourses([]);
      setPreferredCourse("");
    }
  }, [preferredUniversity, courses, universities]);

  const fetchCountries = async () => {
    try {
      const data = await CountriesAPI.getAll();
      setCountries(data || []);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    }
  };

  const fetchUniversities = async () => {
    try {
      const data = await UniversitiesAPI.getAll();
      console.log("Fetched universities:", data);
      setUniversities(data || []);
      setFilteredUniversities(data || []);
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await CoursesAPI.getAll();
      console.log("Fetched courses:", data);
      setCourses(data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name || !email || !mobile || !preferredCourse) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Get user data from cookies
      const userStr = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-user="))
        ?.split("=")[1];
      
      let userId = null;
      let user: any = null;
      if (userStr) {
        try {
          user = JSON.parse(decodeURIComponent(userStr));
          userId = user.id;
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }

      // Step 1: Create lead
      const leadData = {
        name,
        email,
        mobile,
        preferred_course: preferredCourse,
        preferred_country: preferredCountry || undefined,
        agent_id: userId,
        branch_id: user.branch_id,
        type: "application",
        status: "new",
        utm_campaign: "B2B Portal",
        utm_source: "Referral",
        utm_medium: userId ? user.name : "Agent",
      };

      const createdLead = await LeadsAPI.createLead(leadData);
      const leadId = createdLead.id;

      // Step 2: Create/Update application preferences with university
      if (preferredUniversity) {
        await ApplicationsAPI.updatePreferences(leadId, {
          preferred_country: preferredCountry || undefined,
          preferred_university: preferredUniversity,
        });
      }

      alert("Application created successfully!");
      
      // Reset form
      setName("");
      setEmail("");
      setMobile("");
      setPreferredCourse("");
      setPreferredCountry("");
      setPreferredUniversity("");
      setFilteredUniversities([]);
      setFilteredCourses([]);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create application:", error);
      
      // Handle duplicate errors
      if (error.status === 409) {
        if (error.field === 'email') {
          alert("A lead with this email already exists");
        } else if (error.field === 'mobile') {
          alert("A lead with this mobile number already exists");
        } else {
          alert(error.message || "This lead already exists");
        }
      } else {
        alert(error.message || "Failed to create application. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setName("");
      setEmail("");
      setMobile("");
      setPreferredCourse("");
      setPreferredCountry("");
      setPreferredUniversity("");
      setFilteredUniversities([]);
      setFilteredCourses([]);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!loading}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Create New Application
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter student name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              isRequired
              isDisabled={loading}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isRequired
              isDisabled={loading}
            />

            <Input
              label="Mobile"
              type="tel"
              placeholder="Enter mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              isRequired
              isDisabled={loading}
            />

            <Select
              label="Preferred Country"
              placeholder="Select a country"
              selectedKeys={preferredCountry ? [preferredCountry] : []}
              onChange={(e) => setPreferredCountry(e.target.value)}
              isDisabled={loading}
            >
              {countries.map((country) => (
                <SelectItem key={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Preferred University"
              placeholder={
                preferredCountry
                  ? "Select a university"
                  : "Please select a country first"
              }
              selectedKeys={preferredUniversity ? [preferredUniversity] : []}
              onChange={(e) => setPreferredUniversity(e.target.value)}
              isDisabled={loading || !preferredCountry}
            >
              {filteredUniversities.map((university) => (
                <SelectItem key={university.name}>
                  {university.name}
                </SelectItem>
              ))}
            </Select>

            <Select
              label="Preferred Course"
              placeholder={
                preferredUniversity
                  ? "Select a course"
                  : "Please select a university first"
              }
              selectedKeys={preferredCourse ? [preferredCourse] : []}
              onChange={(e) => setPreferredCourse(e.target.value)}
              isRequired
              isDisabled={loading || !preferredUniversity}
            >
              {filteredCourses.map((course) => (
                <SelectItem key={course.name}>
                  
                  {`${course.name} ${course.level ? ` (${course.level})` : ""}`}
                </SelectItem>
              ))}
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            isDisabled={loading}
          >
            Cancel
          </Button>
          <Button
            style={{ background: 'linear-gradient(90deg, #bc4e9c, #f80759)' }}
            onPress={handleSubmit}
            isLoading={loading}
            className="text-white"
          >
            {loading ? "Creating..." : "Create Application"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateApplicationModal;
