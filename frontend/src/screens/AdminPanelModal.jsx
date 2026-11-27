import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getColors } from '../constants/theme';
import {
  buildMapIframeHtml,
  getGoogleMapsEmbedUrl,
  getPlaceImageSource,
  openGoogleMapsLocation,
} from '../constants/placesCatalog';
import { useSavedPlaces } from '../context/SavedPlacesContext';

const ADMIN_NUMERIC_PIN = '20262026';
const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '⌫'],
];

const PLACE_CATEGORIES = ['Naturaleza', 'Cultura', 'Artesanía', 'Aventura'];
const DIR_CATEGORIES = ['Gastronomía', 'Artesanía', 'Hoteles'];
const PERFIL_SECTIONS = [
  { key: 'emergencias', label: 'Emergencias' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'favoritos', label: 'Favoritos' },
];

const EMPTY_PLACE_FORM = {
  nombre: '',
  categoria: 'Naturaleza',
  esExperienciaHoy: false,
  ubicacion: '',
  direccionCorta: '',
  distanciaCorta: 'Centro',
  altitudTexto: '2,625 m',
  precioTexto: 'Libre',
  horario: '8:00 am – 5:00 pm',
  tiempoEstimado: '45 min',
  llevar: 'Calzado cómodo, agua y cámara.',
  mejorHorario: '8:00 am – 5:00 pm',
  dificultad: 'Fácil – Moderada',
  desc: '',
  imagen: '',
  mapEmbedUrl: '',
  mapsQuery: '',
};

const EMPTY_DIR_FORM = {
  nombre: '',
  categoria: 'Gastronomía',
  especialidad: '',
  direccion: '',
  rangoPrecio: 'S/ 15 - S/ 45',
  telefono: '',
  imagen: '',
};

const EMPTY_SOS_FORM = {
  titulo: '',
  numero: '',
  detalle: '',
};

const EMPTY_BUS_FORM = {
  tipo: 'buses',
  empresa: '',
  ruta: '',
  terminal: '',
};

const TRANSPORT_TYPES = [
  { key: 'buses', label: 'Buses' },
  { key: 'combis', label: 'Combis' },
  { key: 'autos', label: 'Autos' },
];

const IMAGE_URL_REGEX = /^https?:\/\/\S+$/i;

export default function AdminPanelModal() {
  const insets = useSafeAreaInsets();
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [tempLinkText, setTempLinkText] = useState('');

  const {
    places,
    directoryItems,
    emergencyNumbers,
    busAgencies,
    savedPlaces,
    toggleSaved,
    addNewPlace,
    editPlace,
    removePlace,
    addNewDirectoryItem,
    editDirectoryItem,
    removeDirectoryItem,
    addEmergencyNumber,
    editEmergencyNumber,
    removeEmergencyNumber,
    addBusAgency,
    editBusAgency,
    removeBusAgency,
    adminVisible,
    setAdminVisible,
    adminInitialTab,
    darkMode,
  } = useSavedPlaces();

  const C = getColors(darkMode);

  // 3 rutas administrables: 'places' | 'directory' | 'perfil'
  const [activeTab, setActiveTab] = useState('places');
  const [perfilSubTab, setPerfilSubTab] = useState('emergencias'); // 'emergencias' | 'transporte' | 'favoritos'
  const [mode, setMode] = useState('list'); // 'list' | 'view' | 'form'
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [placeForm, setPlaceForm] = useState(EMPTY_PLACE_FORM);
  const [dirForm, setDirForm] = useState(EMPTY_DIR_FORM);
  const [sosForm, setSosForm] = useState(EMPTY_SOS_FORM);
  const [busForm, setBusForm] = useState(EMPTY_BUS_FORM);

  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adminVisible) {
      setIsUnlocked(false);
      setPinInput('');
      setShowPin(false);
      setPinError('');
      const initial =
        adminInitialTab === 'places' ||
        adminInitialTab === 'directory' ||
        adminInitialTab === 'perfil'
          ? adminInitialTab
          : 'places';
      setActiveTab(initial);
      setPerfilSubTab('emergencias');
      setMode('list');
      setEditingId(null);
      setViewingItem(null);
      setConfirmDeleteId(null);
      setFormError('');
      setSearchQuery('');
    }
  }, [adminVisible, adminInitialTab]);

  const handlePinKeyPress = (key) => {
    setPinError('');
    if (key === 'C') {
      setPinInput('');
      return;
    }
    if (key === '⌫') {
      setPinInput((prev) => prev.slice(0, -1));
      return;
    }
    setPinInput((prev) => {
      if (prev.length >= 10) return prev;
      return `${prev}${key}`;
    });
  };

  const handleUnlockAdmin = () => {
    if (pinInput.trim() === ADMIN_NUMERIC_PIN) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Contraseña numérica incorrecta');
      setPinInput('');
    }
  };

  // Lista activa según la ruta seleccionada (Lugares, Directorio, Perfil)
  const currentSourceList = useMemo(() => {
    if (activeTab === 'places') return places;
    if (activeTab === 'directory') return directoryItems;
    if (activeTab === 'perfil') {
      if (perfilSubTab === 'emergencias') return emergencyNumbers;
      if (perfilSubTab === 'transporte') return busAgencies;
      return savedPlaces;
    }
    return [];
  }, [
    activeTab,
    perfilSubTab,
    places,
    directoryItems,
    emergencyNumbers,
    busAgencies,
    savedPlaces,
  ]);

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentSourceList;
    return currentSourceList.filter((item) => {
      const text = [
        item.nombre,
        item.titulo,
        item.empresa,
        item.categoria,
        item.etiqueta,
        item.ubicacion,
        item.direccionCorta,
        item.direccion,
        item.ruta,
        item.terminal,
        item.detalle,
        item.numero,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    });
  }, [currentSourceList, searchQuery]);

  // Abrir vista "Ver"
  const handleOpenView = (item) => {
    setViewingItem(item);
    setMode('view');
  };

  // Abrir formulario "Agregar"
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError('');
    setUploadedFileName('');
    setShowLinkInput(false);
    setTempLinkText('');
    if (activeTab === 'places') {
      setPlaceForm(EMPTY_PLACE_FORM);
    } else if (activeTab === 'directory') {
      setDirForm(EMPTY_DIR_FORM);
    } else if (activeTab === 'perfil') {
      if (perfilSubTab === 'emergencias') {
        setSosForm(EMPTY_SOS_FORM);
      } else if (perfilSubTab === 'transporte') {
        setBusForm(EMPTY_BUS_FORM);
      }
    }
    setMode('form');
  };

  // Abrir formulario "Editar"
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormError('');
    setUploadedFileName('');
    const existingImg = String(item.imagen || '').trim();
    const isExistingUrl = IMAGE_URL_REGEX.test(existingImg);
    setShowLinkInput(isExistingUrl);
    setTempLinkText(isExistingUrl ? existingImg : '');

    if (
      activeTab === 'places' ||
      (activeTab === 'perfil' && perfilSubTab === 'favoritos')
    ) {
      if (activeTab === 'perfil') setActiveTab('places');
      setPlaceForm({
        nombre: item.nombre || '',
        categoria: item.categoria || 'Naturaleza',
        esExperienciaHoy: item.esExperienciaHoy === true,
        ubicacion: item.ubicacion || item.direccionCorta || '',
        direccionCorta: item.direccionCorta || item.ubicacion || '',
        distanciaCorta: item.distanciaCorta || 'Centro',
        altitudTexto: item.altitudTexto || '2,625 m',
        precioTexto: item.precioTexto || 'Libre',
        horario: item.horario || '8:00 am – 5:00 pm',
        tiempoEstimado: item.tiempoEstimado || item.horario || '45 min',
        llevar: item.tips?.llevar || 'Calzado cómodo, agua y cámara.',
        mejorHorario:
          item.tips?.mejorHorario || item.horario || '8:00 am – 5:00 pm',
        dificultad: item.tips?.dificultad || 'Fácil – Moderada',
        desc: item.desc || '',
        imagen: item.imagen || '',
        mapEmbedUrl: item.mapEmbedUrl || '',
        mapsQuery: item.mapsQuery || '',
      });
    } else if (activeTab === 'directory') {
      setDirForm({
        nombre: item.nombre || '',
        categoria: item.categoria || 'Gastronomía',
        especialidad: item.especialidad || '',
        direccion: item.direccion || '',
        rangoPrecio: item.rangoPrecio || 'S/ 15 - S/ 45',
        telefono: item.telefono || '',
        imagen: item.imagen || '',
      });
    } else if (activeTab === 'perfil') {
      if (perfilSubTab === 'emergencias') {
        setSosForm({
          titulo: item.titulo || '',
          numero: item.numero || '',
          detalle: item.detalle || '',
        });
      } else if (perfilSubTab === 'transporte') {
        setBusForm({
          tipo: item.tipo || 'buses',
          empresa: item.empresa || '',
          ruta: item.ruta || '',
          terminal: item.terminal || '',
        });
      }
    }
    setMode('form');
  };

  // Guardar (Agregar o Editar en cualquiera de las 3 rutas) directamente en la BD
  const handleSaveForm = async () => {
    if (saving) return;
    setFormError('');

    const activeImageVal =
      activeTab === 'places'
        ? (placeForm.imagen || '').trim()
        : activeTab === 'directory'
        ? (dirForm.imagen || '').trim()
        : '';

    if (
      activeImageVal &&
      !activeImageVal.startsWith('data:image/') &&
      !IMAGE_URL_REGEX.test(activeImageVal)
    ) {
      setFormError(
        'El link de la imagen debe empezar con http:// o https://, o sube un archivo desde tu dispositivo.'
      );
      return;
    }

    setSaving(true);
    let res = { ok: true };

    try {
      if (activeTab === 'places') {
        const payload = {
          ...placeForm,
          imagen: activeImageVal,
        };
        res = editingId
          ? await editPlace(editingId, payload)
          : await addNewPlace(payload);
      } else if (activeTab === 'directory') {
        const payload = {
          ...dirForm,
          imagen: activeImageVal,
        };
        res = editingId
          ? await editDirectoryItem(editingId, payload)
          : await addNewDirectoryItem(payload);
      } else if (activeTab === 'perfil') {
        if (perfilSubTab === 'emergencias') {
          res = editingId
            ? await editEmergencyNumber(editingId, sosForm)
            : await addEmergencyNumber(sosForm);
        } else if (perfilSubTab === 'transporte') {
          res = editingId
            ? await editBusAgency(editingId, busForm)
            : await addBusAgency(busForm);
        }
      }
    } finally {
      setSaving(false);
    }

    if (!res?.ok) {
      setFormError(res?.error || 'Completa los campos obligatorios.');
      return;
    }

    setMode('list');
    setEditingId(null);
  };

  // Abre el selector real de imágenes en Teléfono (Expo Go Android/iOS) o PC (Web)
  const handlePickImageFromDevice = async (setForm) => {
    setFormError('');

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new window.Image();
          img.onload = () => {
            const MAX_W = 680;
            const MAX_H = 440;
            let w = img.width || MAX_W;
            let h = img.height || MAX_H;
            if (w > MAX_W) {
              h = Math.round(h * (MAX_W / w));
              w = MAX_W;
            }
            if (h > MAX_H) {
              w = Math.round(w * (MAX_H / h));
              h = MAX_H;
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.45);
            setUploadedFileName(file.name || 'imagen-subida.jpg');
            setShowLinkInput(false);
            setTempLinkText('');
            setForm((p) => ({ ...p, imagen: dataUrl }));
          };
          img.onerror = () => {
            setUploadedFileName(file.name || 'imagen-subida.jpg');
            setForm((p) => ({ ...p, imagen: ev.target.result }));
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm && perm.granted === false) {
        setFormError(
          'Permite el acceso a tus fotos/galería para poder subir la imagen.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let dataUrl = '';

        // Redimensiona y optimiza la foto (~25-40 KB) para no saturar MongoDB Atlas Free Tier
        try {
          const manipulated = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 680 } }],
            {
              compress: 0.42,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true,
            }
          );
          if (manipulated?.base64) {
            dataUrl = `data:image/jpeg;base64,${manipulated.base64}`;
          }
        } catch {
          // Si falla el redimensionador, usa el base64 comprimido de ImagePicker
        }

        if (!dataUrl) {
          const mime = asset.mimeType || 'image/jpeg';
          dataUrl = asset.base64
            ? `data:${mime};base64,${asset.base64}`
            : asset.uri;
        }

        setUploadedFileName(asset.fileName || 'foto-galeria.jpg');
        setShowLinkInput(false);
        setTempLinkText('');
        setForm((p) => ({ ...p, imagen: dataUrl }));
      }
    } catch (err) {
      setFormError(
        `No se pudo abrir la galería: ${err?.message || 'intenta de nuevo'}`
      );
    }
  };

  // 1) Botón real para subir imagen desde Teléfono o PC
  // 2) Al piecito: Botón para agregar Link (URL) de imagen de referencia / portada
  const renderUploadImageButton = (form, setForm) => {
    const rawImg = (form.imagen || '').trim();
    const isUploadedFile =
      rawImg.startsWith('data:image/') ||
      rawImg.startsWith('file://') ||
      rawImg.startsWith('content://');
    const isUrlImage = !isUploadedFile && IMAGE_URL_REGEX.test(rawImg);
    const hasValidPreview = Boolean(
      rawImg &&
        (isUploadedFile || isUrlImage) &&
        getPlaceImageSource(rawImg)
    );

    const handleApplyImageLink = () => {
      const cleanUrl = tempLinkText.trim();
      if (!cleanUrl) {
        setFormError('Pega un link de imagen antes de aplicar.');
        return;
      }
      if (!IMAGE_URL_REGEX.test(cleanUrl)) {
        setFormError('El link de la imagen debe empezar con http:// o https://');
        return;
      }
      setFormError('');
      setUploadedFileName('');
      setForm((p) => ({ ...p, imagen: cleanUrl }));
    };

    return (
      <View style={styles.uploadSectionWrap}>
        <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
          Imagen de referencia / portada (Se guarda en MongoDB Atlas)
        </Text>

        {/* BOTÓN 1: Subir imagen desde Teléfono o PC */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.uploadDeviceBtn,
            {
              backgroundColor: C.primarySoft,
              borderColor: C.primaryLight,
            },
          ]}
          onPress={() => handlePickImageFromDevice(setForm)}
        >
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.uploadBtnTextCol}>
            <Text style={[styles.uploadBtnTitle, { color: C.text }]}>
              {isUploadedFile
                ? 'Cambiar imagen desde Teléfono o PC'
                : 'Subir imagen desde Teléfono o PC'}
            </Text>
            <Text style={[styles.uploadBtnSub, { color: C.textSecondary }]}>
              {isUploadedFile && uploadedFileName
                ? `Archivo cargado: ${uploadedFileName}`
                : 'Toca aquí para abrir la galería de fotos o archivos'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* BOTÓN 2 (Al piecito): Botón para agregar Link de imagen de referencia */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.linkToggleBtn,
            {
              backgroundColor: showLinkInput || isUrlImage ? C.primarySoft : C.card,
              borderColor: showLinkInput || isUrlImage ? C.primaryLight : C.border,
            },
          ]}
          onPress={() => {
            setFormError('');
            if (!showLinkInput && isUrlImage) {
              setTempLinkText(rawImg);
            }
            setShowLinkInput((prev) => !prev);
          }}
        >
          <View
            style={[
              styles.linkIconCircle,
              {
                backgroundColor:
                  showLinkInput || isUrlImage ? '#0F5C41' : C.cardAlt,
              },
            ]}
          >
            <Ionicons
              name="link-outline"
              size={20}
              color={showLinkInput || isUrlImage ? '#FFFFFF' : C.primaryLight}
            />
          </View>
          <View style={styles.uploadBtnTextCol}>
            <Text style={[styles.uploadBtnTitle, { color: C.text }]}>
              {isUrlImage
                ? 'Cambiar Link de imagen de referencia / portada'
                : 'Subir con Link de imagen de referencia / portada'}
            </Text>
            <Text style={[styles.uploadBtnSub, { color: C.textSecondary }]}>
              {isUrlImage
                ? rawImg
                : 'Toca aquí para pegar un enlace https:// de la imagen'}
            </Text>
          </View>
          <Ionicons
            name={showLinkInput ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={C.textSecondary}
          />
        </TouchableOpacity>

        {/* Caja desplegable al tocar el botón de Link */}
        {showLinkInput && (
          <View
            style={[
              styles.linkInputBox,
              { backgroundColor: C.cardAlt, borderColor: C.border },
            ]}
          >
            <Text style={[styles.linkBoxLabel, { color: C.textSecondary }]}>
              Enlace (URL) de la imagen de portada:
            </Text>
            <View style={styles.linkInputRow}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.linkFlexInput,
                  {
                    backgroundColor: C.card,
                    borderColor: C.border,
                    color: C.text,
                  },
                ]}
                placeholder="https://ejemplo.com/foto-celendin.jpg"
                placeholderTextColor={C.textMuted}
                value={tempLinkText}
                onChangeText={(t) => {
                  setTempLinkText(t);
                  const clean = t.trim();
                  if (IMAGE_URL_REGEX.test(clean)) {
                    setUploadedFileName('');
                    setForm((p) => ({ ...p, imagen: clean }));
                  } else if (!clean && !isUploadedFile) {
                    setForm((p) => ({ ...p, imagen: '' }));
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.applyLinkBtn}
                onPress={handleApplyImageLink}
              >
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.applyLinkBtnText}>Usar Link</Text>
              </TouchableOpacity>
            </View>
            {tempLinkText.trim().length > 0 &&
              !IMAGE_URL_REGEX.test(tempLinkText.trim()) && (
                <Text style={styles.urlInvalidText}>
                  El link debe empezar con http:// o https://
                </Text>
              )}
          </View>
        )}

        {hasValidPreview && (
          <View style={styles.uploadedPreviewWrap}>
            <Image
              source={getPlaceImageSource(rawImg)}
              style={[styles.urlPreview, { borderColor: C.border }]}
              resizeMode="cover"
            />
            <Pressable
              style={styles.removeUploadedImgBtn}
              onPress={() => {
                setUploadedFileName('');
                setTempLinkText('');
                setForm((p) => ({ ...p, imagen: '' }));
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
              <Text style={styles.removeUploadedImgText}>Quitar imagen</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Eliminar en cualquiera de las 3 rutas (también en la BD)
  const handleConfirmDelete = async (id) => {
    setListError('');
    let res = { ok: true };
    if (activeTab === 'places') {
      res = await removePlace(id);
    } else if (activeTab === 'directory') {
      res = await removeDirectoryItem(id);
    } else if (activeTab === 'perfil') {
      if (perfilSubTab === 'emergencias') {
        res = await removeEmergencyNumber(id);
      } else if (perfilSubTab === 'transporte') {
        res = await removeBusAgency(id);
      } else if (perfilSubTab === 'favoritos') {
        toggleSaved(id);
      }
    }

    setConfirmDeleteId(null);
    if (!res?.ok) {
      setListError(res?.error || 'No se pudo eliminar el registro.');
      return;
    }
    if (viewingItem?.id === id) {
      setViewingItem(null);
      setMode('list');
    }
  };

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  const ROUTE_TABS = [
    { key: 'places', label: 'Lugares', icon: 'location-outline' },
    { key: 'directory', label: 'Directorio', icon: 'restaurant-outline' },
    { key: 'perfil', label: 'Perfil', icon: 'person-outline' },
  ];

  const showAddButton = !(activeTab === 'perfil' && perfilSubTab === 'favoritos');

  const placeMapPreviewUrl = useMemo(() => {
    if (activeTab !== 'places') return null;
    const hasMapData =
      placeForm.mapEmbedUrl?.trim() ||
      placeForm.mapsQuery?.trim() ||
      placeForm.nombre?.trim() ||
      placeForm.ubicacion?.trim();
    if (!hasMapData) return null;
    return getGoogleMapsEmbedUrl({
      nombre: placeForm.nombre || 'Celendín',
      ubicacion: placeForm.ubicacion || 'Celendín',
      mapEmbedUrl: placeForm.mapEmbedUrl,
      mapsQuery: placeForm.mapsQuery,
    });
  }, [
    activeTab,
    placeForm.mapEmbedUrl,
    placeForm.mapsQuery,
    placeForm.nombre,
    placeForm.ubicacion,
  ]);

  return (
    <Modal
      visible={adminVisible}
      animationType="slide"
      onRequestClose={() => setAdminVisible(false)}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: C.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Cabecera del Panel de Administrador */}
        <View style={[styles.header, { paddingTop: topPad + 10 }]}>
          <View style={styles.headerTopRow}>
            <View>
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#111827" />
                <Text style={styles.adminBadgeText}>MODO ADMINISTRADOR</Text>
              </View>
              <Text style={styles.headerTitle}>Panel de Control</Text>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={() => setAdminVisible(false)}
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
              <Text style={styles.closeBtnText}>Salir</Text>
            </Pressable>
          </View>

          {/* Selector de las 4 rutas: Inicio | Lugares | Directorio | Perfil */}
          {isUnlocked && (
            <View style={styles.moduleTabs}>
              {ROUTE_TABS.map((rt) => {
                const active = activeTab === rt.key;
                return (
                  <Pressable
                    key={rt.key}
                    style={[
                      styles.moduleTabBtn,
                      active && styles.moduleTabBtnActive,
                    ]}
                    onPress={() => {
                      setActiveTab(rt.key);
                      setMode('list');
                      setConfirmDeleteId(null);
                      setSearchQuery('');
                    }}
                  >
                    <Ionicons
                      name={rt.icon}
                      size={14}
                      color={active ? '#111827' : '#D1FAE5'}
                    />
                    <Text
                      style={[
                        styles.moduleTabText,
                        active && styles.moduleTabTextActive,
                      ]}
                    >
                      {rt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* ================= PANTALLA DE CONTRASEÑA NUMÉRICA ================= */}
        {!isUnlocked ? (
          <View style={styles.pinContainer}>
            <View
              style={[
                styles.pinCard,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              <View style={styles.lockIconCircle}>
                <Ionicons name="lock-closed" size={26} color="#0F5C41" />
              </View>

              <Text style={[styles.pinTitle, { color: C.text }]}>
                Acceso de Administrador
              </Text>
              <Text style={[styles.pinSub, { color: C.textSecondary }]}>
                Ingresa la contraseña numérica única
              </Text>

              <View
                style={[
                  styles.pinDisplayBox,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <Text
                  style={[
                    showPin ? styles.pinNumbersText : styles.pinDotsText,
                    { color: C.text },
                  ]}
                >
                  {pinInput
                    ? showPin
                      ? pinInput
                      : '•'.repeat(pinInput.length)
                    : ''}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.pinEyeBtn}
                  onPress={() => setShowPin((prev) => !prev)}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPin ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={C.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {!!pinError && (
                <Text style={styles.pinErrorText}>{pinError}</Text>
              )}

              <View style={styles.keypadGrid}>
                {KEYPAD_ROWS.map((row, rIdx) => (
                  <View key={`row-${rIdx}`} style={styles.keypadRow}>
                    {row.map((key) => (
                      <Pressable
                        key={key}
                        style={({ pressed }) => [
                          styles.keypadBtn,
                          {
                            backgroundColor: pressed
                              ? C.primarySoft
                              : C.cardAlt,
                            borderColor: C.border,
                          },
                        ]}
                        onPress={() => handlePinKeyPress(key)}
                      >
                        <Text
                          style={[
                            styles.keypadBtnText,
                            {
                              color:
                                key === 'C'
                                  ? '#E11D48'
                                  : key === '⌫'
                                  ? '#D97706'
                                  : C.text,
                            },
                          ]}
                        >
                          {key}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>

              <Pressable
                style={styles.unlockSubmitBtn}
                onPress={handleUnlockAdmin}
              >
                <Ionicons name="key-outline" size={17} color="#FFFFFF" />
                <Text style={styles.unlockSubmitText}>Ingresar al Panel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* ================= MODO 1: LISTA (VER, AGREGAR, EDITAR, ELIMINAR) ================= */}
        {isUnlocked && mode === 'list' && (
          <View style={styles.body}>
            {/* Sub-pestañas para la ruta Perfil (Emergencias, Transporte, Favoritos) */}
            {activeTab === 'perfil' && (
              <View
                style={[
                  styles.perfilSubBar,
                  { backgroundColor: C.card, borderBottomColor: C.border },
                ]}
              >
                {PERFIL_SECTIONS.map((sec) => {
                  const active = perfilSubTab === sec.key;
                  return (
                    <Pressable
                      key={sec.key}
                      style={[
                        styles.perfilSubChip,
                        active
                          ? styles.perfilSubChipActive
                          : {
                              backgroundColor: C.cardAlt,
                              borderColor: C.border,
                            },
                      ]}
                      onPress={() => {
                        setPerfilSubTab(sec.key);
                        setConfirmDeleteId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.perfilSubChipText,
                          { color: active ? '#FFFFFF' : C.text },
                        ]}
                      >
                        {sec.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Barra de búsqueda + Botón Agregar */}
            <View
              style={[
                styles.toolbar,
                { backgroundColor: C.card, borderBottomColor: C.border },
              ]}
            >
              <View
                style={[
                  styles.searchBox,
                  { backgroundColor: C.cardAlt, borderColor: C.border },
                ]}
              >
                <Ionicons name="search-outline" size={16} color={C.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: C.text }]}
                  placeholder="Buscar registro..."
                  placeholderTextColor={C.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={C.textMuted}
                    />
                  </Pressable>
                )}
              </View>

              {showAddButton && (
                <Pressable style={styles.createBtn} onPress={handleOpenCreate}>
                  <Ionicons name="add-circle" size={17} color="#FFFFFF" />
                  <Text style={styles.createBtnText}>Agregar</Text>
                </Pressable>
              )}
            </View>

            {!!listError && (
              <Text style={[styles.formErrorText, styles.listErrorText]}>
                {listError}
              </Text>
            )}

            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredList.map((item) => {
                const isConfirmingDelete = confirmDeleteId === item.id;
                const hasImage =
                  activeTab === 'places' ||
                  activeTab === 'directory' ||
                  (activeTab === 'perfil' && perfilSubTab === 'favoritos');

                const displayTitle =
                  item.nombre || item.titulo || item.empresa || '';
                const displayBadge =
                  item.categoria ||
                  item.etiqueta ||
                  (perfilSubTab === 'emergencias'
                    ? 'Emergencia'
                    : 'Transporte');
                const displaySub =
                  activeTab === 'places' ||
                  (activeTab === 'perfil' && perfilSubTab === 'favoritos')
                    ? `${item.direccionCorta || item.ubicacion} • ${
                        item.distanciaCorta || 'Centro'
                      } • ${item.precioTexto || 'Libre'}`
                    : activeTab === 'directory'
                    ? `${item.direccion} • ${item.telefono}`
                    : perfilSubTab === 'emergencias'
                    ? `${item.numero} • ${item.detalle}`
                    : `${item.ruta} • ${item.terminal}`;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemCard,
                      { backgroundColor: C.card, borderColor: C.border },
                    ]}
                  >
                    <View style={styles.itemTopRow}>
                      {hasImage && getPlaceImageSource(item) ? (
                        <Image
                          source={getPlaceImageSource(item)}
                          style={styles.itemThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.iconThumb,
                            { backgroundColor: C.primarySoft },
                          ]}
                        >
                          <Ionicons
                            name={
                              hasImage
                                ? 'image-outline'
                                : perfilSubTab === 'emergencias'
                                ? 'call-outline'
                                : 'bus-outline'
                            }
                            size={22}
                            color={C.primaryLight}
                          />
                        </View>
                      )}

                      <View style={styles.itemInfo}>
                        <View style={styles.itemBadgeRow}>
                          <View style={styles.catBadge}>
                            <Text style={styles.catBadgeText}>
                              {displayBadge}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[styles.itemName, { color: C.text }]}
                          numberOfLines={1}
                        >
                          {displayTitle}
                        </Text>

                        <Text
                          style={[styles.itemSub, { color: C.textSecondary }]}
                          numberOfLines={1}
                        >
                          {displaySub}
                        </Text>
                      </View>
                    </View>

                    {/* Botones de rol: Ver, Editar, Eliminar */}
                    {isConfirmingDelete ? (
                      <View style={styles.confirmDeleteBar}>
                        <Text style={styles.confirmDeleteText}>
                          ¿Eliminar este registro?
                        </Text>
                        <View style={styles.confirmBtnsRow}>
                          <Pressable
                            style={styles.confirmCancelBtn}
                            onPress={() => setConfirmDeleteId(null)}
                          >
                            <Text style={styles.confirmCancelText}>
                              Cancelar
                            </Text>
                          </Pressable>
                          <Pressable
                            style={styles.confirmYesBtn}
                            onPress={() => handleConfirmDelete(item.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color="#FFFFFF"
                            />
                            <Text style={styles.confirmYesText}>
                              Sí, eliminar
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.actionsBar,
                          { borderTopColor: C.border },
                        ]}
                      >
                        <Pressable
                          style={[
                            styles.actionBtn,
                            { backgroundColor: C.cardAlt },
                          ]}
                          onPress={() => handleOpenView(item)}
                        >
                          <Ionicons
                            name="eye-outline"
                            size={15}
                            color={C.primaryLight}
                          />
                          <Text
                            style={[styles.actionBtnText, { color: C.text }]}
                          >
                            Ver
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.actionBtn,
                            { backgroundColor: C.cardAlt },
                          ]}
                          onPress={() => handleOpenEdit(item)}
                        >
                          <Ionicons
                            name="create-outline"
                            size={15}
                            color="#D97706"
                          />
                          <Text
                            style={[styles.actionBtnText, { color: C.text }]}
                          >
                            Editar
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionBtn, styles.deleteActionBtn]}
                          onPress={() => setConfirmDeleteId(item.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={15}
                            color="#E11D48"
                          />
                          <Text style={styles.deleteActionText}>Eliminar</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ================= MODO 2: VER FICHA COMPLETA ================= */}
        {isUnlocked && mode === 'view' && viewingItem && (
          <View style={styles.body}>
            <View
              style={[
                styles.subHeader,
                { backgroundColor: C.card, borderBottomColor: C.border },
              ]}
            >
              <Pressable
                style={styles.backRowBtn}
                onPress={() => setMode('list')}
              >
                <Ionicons name="arrow-back" size={18} color={C.text} />
                <Text style={[styles.subHeaderTitle, { color: C.text }]}>
                  Detalle del Registro
                </Text>
              </Pressable>

              <Pressable
                style={styles.editFromViewBtn}
                onPress={() => handleOpenEdit(viewingItem)}
              >
                <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                <Text style={styles.editFromViewText}>Editar</Text>
              </Pressable>
            </View>

            {!!listError && (
              <Text style={[styles.formErrorText, styles.listErrorText]}>
                {listError}
              </Text>
            )}

            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.listContent}
            >
              <View
                style={[
                  styles.viewCard,
                  { backgroundColor: C.card, borderColor: C.border },
                ]}
              >
                {getPlaceImageSource(viewingItem) && (
                  <Image
                    source={getPlaceImageSource(viewingItem)}
                    style={styles.viewHeroImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.viewCardBody}>
                  <Text style={[styles.viewTitle, { color: C.text }]}>
                    {viewingItem.nombre ||
                      viewingItem.titulo ||
                      viewingItem.empresa}
                  </Text>

                  {viewingItem.tips && (
                    <View style={styles.viewFieldRow}>
                      <Text
                        style={[styles.viewFieldLabel, { color: C.textMuted }]}
                      >
                        RECOMENDACIONES / QUÉ LLEVAR:
                      </Text>
                      <Text
                        style={[styles.viewFieldValue, { color: C.text }]}
                      >
                        {[
                          viewingItem.tips.llevar &&
                            `Llevar: ${viewingItem.tips.llevar}`,
                          viewingItem.tips.mejorHorario &&
                            `Mejor horario: ${viewingItem.tips.mejorHorario}`,
                          viewingItem.tips.dificultad &&
                            `Dificultad: ${viewingItem.tips.dificultad}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  )}

                  {Object.entries(viewingItem)
                    .filter(
                      ([k, v]) =>
                        ![
                          'id',
                          '_id',
                          'resenas',
                          'tips',
                          'imagen',
                          'imagenUrl',
                          'mapEmbedUrl',
                        ].includes(k) &&
                        v !== '' &&
                        v != null
                    )
                    .map(([k, v]) => (
                      <View key={k} style={styles.viewFieldRow}>
                        <Text
                          style={[styles.viewFieldLabel, { color: C.textMuted }]}
                        >
                          {k.toUpperCase()}:
                        </Text>
                        <Text
                          style={[styles.viewFieldValue, { color: C.text }]}
                        >
                          {String(v)}
                        </Text>
                      </View>
                    ))}

                  {(activeTab === 'places' ||
                    (activeTab === 'perfil' &&
                      perfilSubTab === 'favoritos')) && (
                    <View style={styles.mapPreviewSection}>
                      <Text
                        style={[styles.viewFieldLabel, { color: C.textMuted }]}
                      >
                        UBICACIÓN EN EL MAPA:
                      </Text>
                      <View
                        style={[
                          styles.mapFrameWrap,
                          { borderColor: C.border, backgroundColor: C.cardAlt },
                        ]}
                      >
                        {Platform.OS === 'web' ? (
                          <iframe
                            src={getGoogleMapsEmbedUrl(viewingItem)}
                            style={{ width: '100%', height: '100%', border: 0 }}
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : (
                          <WebView
                            source={{
                              html: buildMapIframeHtml(
                                getGoogleMapsEmbedUrl(viewingItem)
                              ),
                            }}
                            style={styles.mapWebView}
                            javaScriptEnabled
                            domStorageEnabled
                          />
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ================= MODO 3: FORMULARIO (AGREGAR / EDITAR EN LAS 3 RUTAS) ================= */}
        {isUnlocked && mode === 'form' && (
          <View style={styles.body}>
            <View
              style={[
                styles.subHeader,
                { backgroundColor: C.card, borderBottomColor: C.border },
              ]}
            >
              <Pressable
                style={styles.backRowBtn}
                onPress={() => setMode('list')}
              >
                <Ionicons name="arrow-back" size={18} color={C.text} />
                <Text style={[styles.subHeaderTitle, { color: C.text }]}>
                  {editingId ? 'Editar Registro' : 'Nuevo Registro'}
                </Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.listScroll}
              contentContainerStyle={styles.formScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* FORMULARIO RUTA 1: LUGARES TURÍSTICOS (CON DETALLES Y MAPA) */}
              {activeTab === 'places' && (
                <>
                  <View
                    style={[
                      styles.formSectionHeader,
                      { backgroundColor: C.primarySoft },
                    ]}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={C.primaryLight}
                    />
                    <Text
                      style={[
                        styles.formSectionTitle,
                        { color: C.primaryLight },
                      ]}
                    >
                      1. Información General del Lugar
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Nombre del lugar turístico *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Catarata El Cornelio / Laguna de Mamacocha"
                    placeholderTextColor={C.textMuted}
                    value={placeForm.nombre}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, nombre: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Categoría
                  </Text>
                  <View style={styles.chipsRow}>
                    {PLACE_CATEGORIES.map((cat) => {
                      const active = placeForm.categoria === cat;
                      return (
                        <Pressable
                          key={cat}
                          style={[
                            styles.catChip,
                            active
                              ? styles.catChipActive
                              : {
                                  backgroundColor: C.card,
                                  borderColor: C.border,
                                },
                          ]}
                          onPress={() =>
                            setPlaceForm((p) => ({ ...p, categoria: cat }))
                          }
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              { color: active ? '#FFFFFF' : C.text },
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    ¿Mostrar en Destacados de Celendín (Inicio)?
                  </Text>
                  <View style={styles.chipsRow}>
                    <Pressable
                      style={[
                        styles.catChip,
                        styles.featuredOptionChip,
                        placeForm.esExperienciaHoy
                          ? styles.catChipActive
                          : {
                              backgroundColor: C.card,
                              borderColor: C.border,
                            },
                      ]}
                      onPress={() =>
                        setPlaceForm((p) => ({ ...p, esExperienciaHoy: true }))
                      }
                    >
                      <Ionicons
                        name={
                          placeForm.esExperienciaHoy
                            ? 'star'
                            : 'star-outline'
                        }
                        size={14}
                        color={placeForm.esExperienciaHoy ? '#FBBF24' : C.textSecondary}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          {
                            color: placeForm.esExperienciaHoy
                              ? '#FFFFFF'
                              : C.text,
                          },
                        ]}
                      >
                        Marcar como Destacado
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.catChip,
                        styles.featuredOptionChip,
                        !placeForm.esExperienciaHoy
                          ? styles.catChipActive
                          : {
                              backgroundColor: C.card,
                              borderColor: C.border,
                            },
                      ]}
                      onPress={() =>
                        setPlaceForm((p) => ({ ...p, esExperienciaHoy: false }))
                      }
                    >
                      <Ionicons
                        name={
                          !placeForm.esExperienciaHoy
                            ? 'close-circle'
                            : 'close-circle-outline'
                        }
                        size={14}
                        color={!placeForm.esExperienciaHoy ? '#FFFFFF' : C.textSecondary}
                      />
                      <Text
                        style={[
                          styles.catChipText,
                          {
                            color: !placeForm.esExperienciaHoy
                              ? '#FFFFFF'
                              : C.text,
                          },
                        ]}
                      >
                        No Destacado
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Ubicación completa (para ficha de detalle) *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. C.P. Jerez, Huasmín · Celendín"
                    placeholderTextColor={C.textMuted}
                    value={placeForm.ubicacion}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, ubicacion: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Ubicación corta (para tarjeta en lista)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Huasmín, Celendín"
                    placeholderTextColor={C.textMuted}
                    value={placeForm.direccionCorta}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, direccionCorta: t }))
                    }
                  />

                  <View style={styles.threeCols}>
                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Distancia
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="Ej. 32 km o Centro"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.distanciaCorta}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, distanciaCorta: t }))
                        }
                      />
                    </View>

                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Altitud
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="Ej. 2,840 m"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.altitudTexto}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, altitudTexto: t }))
                        }
                      />
                    </View>

                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Entrada
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="Libre o S/ 5.00"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.precioTexto}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, precioTexto: t }))
                        }
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Descripción del lugar *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textArea,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Describe el atractivo turístico, paisaje, historia..."
                    placeholderTextColor={C.textMuted}
                    value={placeForm.desc}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, desc: t }))
                    }
                    multiline
                  />

                  {/* SECCIÓN 2: DETALLES DE VISITA */}
                  <View
                    style={[
                      styles.formSectionHeader,
                      { backgroundColor: C.primarySoft, marginTop: 18 },
                    ]}
                  >
                    <Ionicons
                      name="compass-outline"
                      size={16}
                      color={C.primaryLight}
                    />
                    <Text
                      style={[
                        styles.formSectionTitle,
                        { color: C.primaryLight },
                      ]}
                    >
                      2. Detalles de Visita y Recomendaciones
                    </Text>
                  </View>

                  <View style={styles.threeCols}>
                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Horario de atención
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="6:30 am – 4:30 pm"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.horario}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, horario: t }))
                        }
                      />
                    </View>

                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Tiempo estimado
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="50 min en auto + 30 min"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.tiempoEstimado}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, tiempoEstimado: t }))
                        }
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    ¿Qué llevar? (Recomendaciones al viajero)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Calzado de trekking, impermeable, bloqueador y agua."
                    placeholderTextColor={C.textMuted}
                    value={placeForm.llevar}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, llevar: t }))
                    }
                  />

                  <View style={styles.threeCols}>
                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Mejor horario de visita
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="7:30 am – 1:30 pm"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.mejorHorario}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, mejorHorario: t }))
                        }
                      />
                    </View>

                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Nivel de dificultad
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="Fácil / Moderada"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.dificultad}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, dificultad: t }))
                        }
                      />
                    </View>
                  </View>

                  {/* SECCIÓN 3: MAPA DONDE SE ENCUENTRA EL LUGAR */}
                  <View
                    style={[
                      styles.formSectionHeader,
                      { backgroundColor: C.primarySoft, marginTop: 18 },
                    ]}
                  >
                    <Ionicons
                      name="map-outline"
                      size={16}
                      color={C.primaryLight}
                    />
                    <Text
                      style={[
                        styles.formSectionTitle,
                        { color: C.primaryLight },
                      ]}
                    >
                      3. Mapa donde se encuentra el Lugar
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Enlace o código iframe de Google Maps
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder='Pega el link de Google Maps o <iframe src="...">'
                    placeholderTextColor={C.textMuted}
                    value={placeForm.mapEmbedUrl}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({
                        ...p,
                        mapEmbedUrl: t,
                      }))
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Text style={[styles.inputHint, { color: C.textMuted }]}>
                    Puedes pegar el enlace de Google Maps (Compartir → Insertar
                    un mapa) o escribir la referencia de búsqueda abajo.
                  </Text>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Referencia de búsqueda en Google Maps
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Catarata El Cornelio, Huasmin, Celendin, Cajamarca"
                    placeholderTextColor={C.textMuted}
                    value={placeForm.mapsQuery}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, mapsQuery: t }))
                    }
                  />

                  {placeMapPreviewUrl ? (
                    <View style={styles.mapPreviewSection}>
                      <View style={styles.mapPreviewTitleRow}>
                        <Text
                          style={[
                            styles.inputLabel,
                            {
                              color: C.textSecondary,
                              marginTop: 0,
                              marginBottom: 0,
                            },
                          ]}
                        >
                          Vista previa del mapa en Detalles
                        </Text>
                        <Pressable
                          style={styles.testMapsLinkBtn}
                          onPress={() =>
                            openGoogleMapsLocation({
                              nombre: placeForm.nombre || 'Celendín',
                              ubicacion: placeForm.ubicacion || 'Celendín',
                              mapsQuery: placeForm.mapsQuery,
                            })
                          }
                        >
                          <Ionicons
                            name="open-outline"
                            size={13}
                            color={C.primaryLight}
                          />
                          <Text
                            style={[
                              styles.testMapsLinkText,
                              { color: C.primaryLight },
                            ]}
                          >
                            Probar en Google Maps
                          </Text>
                        </Pressable>
                      </View>
                      <View
                        style={[
                          styles.mapFrameWrap,
                          { borderColor: C.border, backgroundColor: C.cardAlt },
                        ]}
                      >
                        {Platform.OS === 'web' ? (
                          <iframe
                            src={placeMapPreviewUrl}
                            style={{ width: '100%', height: '100%', border: 0 }}
                            allowFullScreen
                            loading="lazy"
                          />
                        ) : (
                          <WebView
                            source={{
                              html: buildMapIframeHtml(placeMapPreviewUrl),
                            }}
                            style={styles.mapWebView}
                            javaScriptEnabled
                            domStorageEnabled
                          />
                        )}
                      </View>
                    </View>
                  ) : null}

                  {/* BOTÓN PARA SUBIR IMAGEN DESDE TELÉFONO O PC + LINK DE IMAGEN */}
                  {renderUploadImageButton(placeForm, setPlaceForm)}
                </>
              )}

              {/* FORMULARIO RUTA 2: DIRECTORIO */}
              {activeTab === 'directory' && (
                <>
                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Nombre del establecimiento *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Restaurant La Reserve"
                    placeholderTextColor={C.textMuted}
                    value={dirForm.nombre}
                    onChangeText={(t) =>
                      setDirForm((p) => ({ ...p, nombre: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Categoría
                  </Text>
                  <View style={styles.chipsRow}>
                    {DIR_CATEGORIES.map((cat) => {
                      const active = dirForm.categoria === cat;
                      return (
                        <Pressable
                          key={cat}
                          style={[
                            styles.catChip,
                            active
                              ? styles.catChipActive
                              : {
                                  backgroundColor: C.card,
                                  borderColor: C.border,
                                },
                          ]}
                          onPress={() =>
                            setDirForm((p) => ({ ...p, categoria: cat }))
                          }
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              { color: active ? '#FFFFFF' : C.text },
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Especialidad / Servicio *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Cuy frito, chocolate artesanal, hotel..."
                    placeholderTextColor={C.textMuted}
                    value={dirForm.especialidad}
                    onChangeText={(t) =>
                      setDirForm((p) => ({ ...p, especialidad: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Dirección *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Jr. José Gálvez 404-A, Celendín"
                    placeholderTextColor={C.textMuted}
                    value={dirForm.direccion}
                    onChangeText={(t) =>
                      setDirForm((p) => ({ ...p, direccion: t }))
                    }
                  />

                  <View style={styles.threeCols}>
                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Rango de precio
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="S/ 20 - S/ 45"
                        placeholderTextColor={C.textMuted}
                        value={dirForm.rangoPrecio}
                        onChangeText={(t) =>
                          setDirForm((p) => ({ ...p, rangoPrecio: t }))
                        }
                      />
                    </View>

                    <View style={styles.col}>
                      <Text
                        style={[styles.inputLabel, { color: C.textSecondary }]}
                      >
                        Teléfono / WhatsApp
                      </Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: C.card,
                            borderColor: C.border,
                            color: C.text,
                          },
                        ]}
                        placeholder="976579996"
                        placeholderTextColor={C.textMuted}
                        value={dirForm.telefono}
                        onChangeText={(t) =>
                          setDirForm((p) => ({ ...p, telefono: t }))
                        }
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {renderUploadImageButton(dirForm, setDirForm)}
                </>
              )}

              {/* FORMULARIO RUTA 4: PERFIL (EMERGENCIAS Y TRANSPORTE) */}
              {activeTab === 'perfil' && perfilSubTab === 'emergencias' && (
                <>
                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Institución de Emergencia *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Comisaría PNP Celendín"
                    placeholderTextColor={C.textMuted}
                    value={sosForm.titulo}
                    onChangeText={(t) =>
                      setSosForm((p) => ({ ...p, titulo: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Número telefónico *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. 964 765 077 o 105"
                    placeholderTextColor={C.textMuted}
                    value={sosForm.numero}
                    onChangeText={(t) =>
                      setSosForm((p) => ({ ...p, numero: t }))
                    }
                    keyboardType="phone-pad"
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Dirección / Detalle
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Av. Cajamarca Cdra. 1 · Atención 24h"
                    placeholderTextColor={C.textMuted}
                    value={sosForm.detalle}
                    onChangeText={(t) =>
                      setSosForm((p) => ({ ...p, detalle: t }))
                    }
                  />
                </>
              )}

              {activeTab === 'perfil' && perfilSubTab === 'transporte' && (
                <>
                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Tipo de transporte
                  </Text>
                  <View style={styles.chipsRow}>
                    {TRANSPORT_TYPES.map((t) => {
                      const active = (busForm.tipo || 'buses') === t.key;
                      return (
                        <Pressable
                          key={t.key}
                          style={[
                            styles.catChip,
                            active
                              ? styles.catChipActive
                              : { backgroundColor: C.card, borderColor: C.border },
                          ]}
                          onPress={() => setBusForm((p) => ({ ...p, tipo: t.key }))}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              { color: active ? '#FFFFFF' : C.text },
                            ]}
                          >
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Nombre de la Agencia / Ruta *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Transportes Palacios"
                    placeholderTextColor={C.textMuted}
                    value={busForm.empresa}
                    onChangeText={(t) =>
                      setBusForm((p) => ({ ...p, empresa: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Ruta de viaje *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Celendín ↔ Cajamarca"
                    placeholderTextColor={C.textMuted}
                    value={busForm.ruta}
                    onChangeText={(t) =>
                      setBusForm((p) => ({ ...p, ruta: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Dirección de Agencia / Terminal *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: C.card,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    placeholder="Ej. Jr. Pardo 462, Celendín"
                    placeholderTextColor={C.textMuted}
                    value={busForm.terminal}
                    onChangeText={(t) =>
                      setBusForm((p) => ({ ...p, terminal: t }))
                    }
                  />
                </>
              )}

              {!!formError && (
                <Text style={styles.formErrorText}>{formError}</Text>
              )}

              <View style={styles.formFooterBtns}>
                <Pressable
                  style={[styles.cancelFormBtn, { borderColor: C.border }]}
                  onPress={() => setMode('list')}
                >
                  <Text
                    style={[styles.cancelFormText, { color: C.textSecondary }]}
                  >
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.saveFormBtn, saving && { opacity: 0.7 }]}
                  disabled={saving}
                  onPress={handleSaveForm}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={17}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveFormText}>
                    {saving
                      ? 'Guardando...'
                      : editingId
                      ? 'Guardar Cambios'
                      : 'Crear Registro'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#0F5C41',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5A623',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    gap: 4,
    marginBottom: 4,
  },
  adminBadgeText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  moduleTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 12,
    padding: 4,
    marginTop: 14,
    gap: 4,
  },
  moduleTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4,
  },
  moduleTabBtnActive: {
    backgroundColor: '#F5A623',
  },
  moduleTabText: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '800',
  },
  moduleTabTextActive: {
    color: '#111827',
  },
  body: {
    flex: 1,
  },
  perfilSubBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  perfilSubChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
  },
  perfilSubChipActive: {
    backgroundColor: '#0F5C41',
    borderColor: '#0F5C41',
  },
  perfilSubChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  createBtn: {
    height: 38,
    backgroundColor: '#0F5C41',
    borderRadius: 10,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemTopRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  iconThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catBadgeText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteActionBtn: {
    backgroundColor: '#FFF1F2',
  },
  deleteActionText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  confirmDeleteBar: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmDeleteText: {
    color: '#9F1239',
    fontSize: 12.5,
    fontWeight: '800',
  },
  confirmBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmCancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  confirmCancelText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmYesBtn: {
    backgroundColor: '#E11D48',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmYesText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  backRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  editFromViewBtn: {
    backgroundColor: '#D97706',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editFromViewText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  viewCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  viewHeroImage: {
    width: '100%',
    height: 170,
    backgroundColor: '#1F2937',
  },
  viewCardBody: {
    padding: 16,
    gap: 10,
  },
  viewTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  viewFieldRow: {
    gap: 2,
  },
  viewFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  viewFieldValue: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  formScrollContent: {
    padding: 16,
    paddingBottom: 34,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
    marginTop: 4,
  },
  formSectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  mapPreviewSection: {
    marginTop: 12,
    gap: 6,
  },
  mapPreviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testMapsLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  testMapsLinkText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  mapFrameWrap: {
    height: 190,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapWebView: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 11,
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  featuredOptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  catChipActive: {
    backgroundColor: '#0F5C41',
    borderColor: '#0F5C41',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  threeCols: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  uploadSectionWrap: {
    marginTop: 8,
  },
  uploadDeviceBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  directFileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: 'transparent',
  },
  transparentWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F5C41',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkToggleBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInputBox: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  linkBoxLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkFlexInput: {
    flex: 1,
  },
  applyLinkBtn: {
    height: 40,
    backgroundColor: '#0F5C41',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  applyLinkBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  uploadBtnTextCol: {
    flex: 1,
  },
  uploadBtnTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  uploadBtnSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  uploadedPreviewWrap: {
    marginTop: 10,
    position: 'relative',
  },
  removeUploadedImgBtn: {
    position: 'absolute',
    top: 16,
    right: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.92)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeUploadedImgText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  hiddenPickerWebView: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  inputHint: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  urlPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    backgroundColor: '#E5E7EB',
  },
  urlInvalidText: {
    color: '#E11D48',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 6,
  },
  listErrorText: {
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  presetCard: {
    width: 86,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  presetThumb: {
    width: '100%',
    height: 50,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 3,
  },
  formErrorText: {
    color: '#E11D48',
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 10,
  },
  formFooterBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelFormBtn: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFormText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  saveFormBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveFormText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  pinCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  lockIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E6F4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pinTitle: {
    fontSize: 19,
    fontWeight: '800',
  },
  pinSub: {
    fontSize: 12.5,
    marginTop: 3,
    marginBottom: 14,
  },
  pinDisplayBox: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
    paddingHorizontal: 44,
  },
  pinDotsText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 6,
  },
  pinNumbersText: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 4,
  },
  pinEyeBtn: {
    position: 'absolute',
    right: 12,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinErrorText: {
    color: '#E11D48',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  keypadGrid: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keypadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  unlockSubmitBtn: {
    marginTop: 14,
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0F5C41',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  unlockSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
