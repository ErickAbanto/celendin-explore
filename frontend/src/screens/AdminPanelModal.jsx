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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getColors } from '../constants/theme';
import {
  getPlaceImageSource,
  IMAGE_PRESETS,
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
const HOME_TARGETS = [
  { key: 'Directorio', label: 'Directorio' },
  { key: 'Lugares', label: 'Lugares' },
  { key: 'Perfil / Offline', label: 'Perfil' },
];
const PERFIL_SECTIONS = [
  { key: 'emergencias', label: 'Emergencias' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'favoritos', label: 'Favoritos' },
];

const EMPTY_HOME_FORM = {
  etiqueta: 'DESTACADO',
  titulo: '',
  subtitulo: '',
  destino: 'Directorio',
};

const EMPTY_PLACE_FORM = {
  nombre: '',
  categoria: 'Naturaleza',
  ubicacion: '',
  distanciaCorta: 'Centro',
  altitudTexto: '2,625 m',
  precioTexto: 'Libre',
  horario: '8:00 am – 5:00 pm',
  llevar: 'Calzado cómodo, agua y cámara.',
  desc: '',
  imagenPreset: '/images/celendin-hero.jpg',
  imagenCustomUrl: '',
};

const EMPTY_DIR_FORM = {
  nombre: '',
  categoria: 'Gastronomía',
  especialidad: '',
  direccion: '',
  rangoPrecio: 'S/ 15 - S/ 45',
  telefono: '',
  imagenPreset: '/images/chocolate-celendin.jpg',
  imagenCustomUrl: '',
};

const EMPTY_SOS_FORM = {
  titulo: '',
  numero: '',
  detalle: '',
};

const EMPTY_BUS_FORM = {
  empresa: '',
  ruta: '',
  terminal: '',
};

export default function AdminPanelModal() {
  const insets = useSafeAreaInsets();
  const {
    places,
    directoryItems,
    homeBanners,
    emergencyNumbers,
    busAgencies,
    savedPlaces,
    toggleSaved,
    addHomeBanner,
    editHomeBanner,
    removeHomeBanner,
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

  // 4 rutas administrables: 'inicio' | 'places' | 'directory' | 'perfil'
  const [activeTab, setActiveTab] = useState('inicio');
  const [perfilSubTab, setPerfilSubTab] = useState('emergencias'); // 'emergencias' | 'transporte' | 'favoritos'
  const [mode, setMode] = useState('list'); // 'list' | 'view' | 'form'
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [homeForm, setHomeForm] = useState(EMPTY_HOME_FORM);
  const [placeForm, setPlaceForm] = useState(EMPTY_PLACE_FORM);
  const [dirForm, setDirForm] = useState(EMPTY_DIR_FORM);
  const [sosForm, setSosForm] = useState(EMPTY_SOS_FORM);
  const [busForm, setBusForm] = useState(EMPTY_BUS_FORM);

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (adminVisible) {
      setIsUnlocked(false);
      setPinInput('');
      setPinError('');
      setActiveTab(adminInitialTab || 'inicio');
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

  // Lista activa según la ruta seleccionada (Inicio, Lugares, Directorio, Perfil)
  const currentSourceList = useMemo(() => {
    if (activeTab === 'inicio') return homeBanners;
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
    homeBanners,
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
    if (activeTab === 'inicio') {
      setHomeForm(EMPTY_HOME_FORM);
    } else if (activeTab === 'places') {
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

    if (activeTab === 'inicio') {
      setHomeForm({
        etiqueta: item.etiqueta || 'DESTACADO',
        titulo: item.titulo || '',
        subtitulo: item.subtitulo || '',
        destino: item.destino || 'Directorio',
      });
    } else if (activeTab === 'places' || (activeTab === 'perfil' && perfilSubTab === 'favoritos')) {
      const isPreset = IMAGE_PRESETS.some((p) => p.key === item.imagen);
      if (activeTab === 'perfil') setActiveTab('places');
      setPlaceForm({
        nombre: item.nombre || '',
        categoria: item.categoria || 'Naturaleza',
        ubicacion: item.direccionCorta || item.ubicacion || '',
        distanciaCorta: item.distanciaCorta || 'Centro',
        altitudTexto: item.altitudTexto || '2,625 m',
        precioTexto: item.precioTexto || 'Libre',
        horario: item.horario || '8:00 am – 5:00 pm',
        llevar: item.tips?.llevar || 'Calzado cómodo, agua y cámara.',
        desc: item.desc || '',
        imagenPreset: isPreset ? item.imagen : '/images/celendin-hero.jpg',
        imagenCustomUrl: isPreset ? '' : item.imagen || '',
      });
    } else if (activeTab === 'directory') {
      const isPreset = IMAGE_PRESETS.some((p) => p.key === item.imagen);
      setDirForm({
        nombre: item.nombre || '',
        categoria: item.categoria || 'Gastronomía',
        especialidad: item.especialidad || '',
        direccion: item.direccion || '',
        rangoPrecio: item.rangoPrecio || 'S/ 15 - S/ 45',
        telefono: item.telefono || '',
        imagenPreset: isPreset ? item.imagen : '/images/chocolate-celendin.jpg',
        imagenCustomUrl: isPreset ? '' : item.imagen || '',
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
          empresa: item.empresa || '',
          ruta: item.ruta || '',
          terminal: item.terminal || '',
        });
      }
    }
    setMode('form');
  };

  // Guardar (Agregar o Editar en cualquiera de las 4 rutas)
  const handleSaveForm = async () => {
    if (saving) return;
    setSaving(true);
    setFormError('');

    let res = { ok: true };

    if (activeTab === 'inicio') {
      res = editingId
        ? editHomeBanner(editingId, homeForm)
        : addHomeBanner(homeForm);
    } else if (activeTab === 'places') {
      const imagen =
        placeForm.imagenCustomUrl.trim() || placeForm.imagenPreset;
      const payload = { ...placeForm, imagen };
      res = editingId
        ? await editPlace(editingId, payload)
        : await addNewPlace(payload);
    } else if (activeTab === 'directory') {
      const imagen = dirForm.imagenCustomUrl.trim() || dirForm.imagenPreset;
      const payload = { ...dirForm, imagen };
      res = editingId
        ? await editDirectoryItem(editingId, payload)
        : await addNewDirectoryItem(payload);
    } else if (activeTab === 'perfil') {
      if (perfilSubTab === 'emergencias') {
        res = editingId
          ? editEmergencyNumber(editingId, sosForm)
          : addEmergencyNumber(sosForm);
      } else if (perfilSubTab === 'transporte') {
        res = editingId
          ? editBusAgency(editingId, busForm)
          : addBusAgency(busForm);
      }
    }

    setSaving(false);
    if (!res?.ok) {
      setFormError(res?.error || 'Completa los campos obligatorios.');
      return;
    }

    setMode('list');
    setEditingId(null);
  };

  // Eliminar en cualquiera de las 4 rutas
  const handleConfirmDelete = async (id) => {
    if (activeTab === 'inicio') {
      removeHomeBanner(id);
    } else if (activeTab === 'places') {
      await removePlace(id);
    } else if (activeTab === 'directory') {
      await removeDirectoryItem(id);
    } else if (activeTab === 'perfil') {
      if (perfilSubTab === 'emergencias') {
        removeEmergencyNumber(id);
      } else if (perfilSubTab === 'transporte') {
        removeBusAgency(id);
      } else if (perfilSubTab === 'favoritos') {
        toggleSaved(id);
      }
    }

    setConfirmDeleteId(null);
    if (viewingItem?.id === id) {
      setViewingItem(null);
      setMode('list');
    }
  };

  const topPad = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16);

  const ROUTE_TABS = [
    { key: 'inicio', label: 'Inicio', icon: 'compass-outline' },
    { key: 'places', label: 'Lugares', icon: 'location-outline' },
    { key: 'directory', label: 'Directorio', icon: 'restaurant-outline' },
    { key: 'perfil', label: 'Perfil', icon: 'person-outline' },
  ];

  const showAddButton = !(activeTab === 'perfil' && perfilSubTab === 'favoritos');

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
                <Text style={[styles.pinDotsText, { color: C.text }]}>
                  {pinInput ? '•'.repeat(pinInput.length) : ''}
                </Text>
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
                  activeTab === 'inicio'
                    ? `${item.subtitulo || 'Banner en Inicio'} • Ir a: ${
                        item.destino
                      }`
                    : activeTab === 'places' ||
                      (activeTab === 'perfil' && perfilSubTab === 'favoritos')
                    ? `${item.direccionCorta || item.ubicacion} • ${
                        item.distanciaCorta || 'Centro'
                      }`
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
                      {hasImage ? (
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
                              activeTab === 'inicio'
                                ? 'megaphone-outline'
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
                {viewingItem.imagen && (
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

                  {Object.entries(viewingItem)
                    .filter(
                      ([k, v]) =>
                        !['id', '_id', 'resenas', 'tips', 'imagen', 'imagenUrl', 'mapEmbedUrl'].includes(
                          k
                        ) &&
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
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ================= MODO 3: FORMULARIO (AGREGAR / EDITAR EN LAS 4 RUTAS) ================= */}
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
              {/* FORMULARIO RUTA 1: INICIO */}
              {activeTab === 'inicio' && (
                <>
                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Etiqueta superior
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
                    placeholder="Ej. DIRECTORIO OFICIAL / TRADICIÓN"
                    placeholderTextColor={C.textMuted}
                    value={homeForm.etiqueta}
                    onChangeText={(t) =>
                      setHomeForm((p) => ({ ...p, etiqueta: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Título en Inicio *
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
                    placeholder="Ej. Feria Dominical del Sombrero"
                    placeholderTextColor={C.textMuted}
                    value={homeForm.titulo}
                    onChangeText={(t) =>
                      setHomeForm((p) => ({ ...p, titulo: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Subtítulo / Descripción
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
                    placeholder="Ej. Domingos desde las 6:30 am en Jr. Dos de Mayo"
                    placeholderTextColor={C.textMuted}
                    value={homeForm.subtitulo}
                    onChangeText={(t) =>
                      setHomeForm((p) => ({ ...p, subtitulo: t }))
                    }
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Ruta de destino al tocar
                  </Text>
                  <View style={styles.chipsRow}>
                    {HOME_TARGETS.map((t) => {
                      const active = homeForm.destino === t.key;
                      return (
                        <Pressable
                          key={t.key}
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
                            setHomeForm((p) => ({ ...p, destino: t.key }))
                          }
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
                </>
              )}

              {/* FORMULARIO RUTA 2: LUGARES */}
              {activeTab === 'places' && (
                <>
                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Nombre del lugar *
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
                    placeholder="Ej. Laguna de Mamacocha"
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
                    Ubicación *
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
                    value={placeForm.ubicacion}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, ubicacion: t }))
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
                        placeholder="12 km"
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
                        placeholder="2,625 m"
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
                        placeholder="Libre"
                        placeholderTextColor={C.textMuted}
                        value={placeForm.precioTexto}
                        onChangeText={(t) =>
                          setPlaceForm((p) => ({ ...p, precioTexto: t }))
                        }
                      />
                    </View>
                  </View>

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Descripción *
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
                    placeholder="Describe el atractivo turístico..."
                    placeholderTextColor={C.textMuted}
                    value={placeForm.desc}
                    onChangeText={(t) =>
                      setPlaceForm((p) => ({ ...p, desc: t }))
                    }
                    multiline
                  />

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Imagen de portada
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetsRow}
                  >
                    {IMAGE_PRESETS.map((preset) => {
                      const selected =
                        !placeForm.imagenCustomUrl.trim() &&
                        placeForm.imagenPreset === preset.key;
                      return (
                        <Pressable
                          key={preset.key}
                          style={[
                            styles.presetCard,
                            {
                              borderColor: selected ? '#0F5C41' : C.border,
                              backgroundColor: selected
                                ? C.primarySoft
                                : C.card,
                            },
                          ]}
                          onPress={() =>
                            setPlaceForm((p) => ({
                              ...p,
                              imagenPreset: preset.key,
                              imagenCustomUrl: '',
                            }))
                          }
                        >
                          <Image
                            source={getPlaceImageSource(preset.key)}
                            style={styles.presetThumb}
                            resizeMode="cover"
                          />
                          <Text
                            style={[
                              styles.presetLabel,
                              {
                                color: selected
                                  ? C.primaryLight
                                  : C.textSecondary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {preset.labelEs}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* FORMULARIO RUTA 3: DIRECTORIO */}
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

                  <Text style={[styles.inputLabel, { color: C.textSecondary }]}>
                    Imagen de portada
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.presetsRow}
                  >
                    {IMAGE_PRESETS.map((preset) => {
                      const selected =
                        !dirForm.imagenCustomUrl.trim() &&
                        dirForm.imagenPreset === preset.key;
                      return (
                        <Pressable
                          key={preset.key}
                          style={[
                            styles.presetCard,
                            {
                              borderColor: selected ? '#0F5C41' : C.border,
                              backgroundColor: selected
                                ? C.primarySoft
                                : C.card,
                            },
                          ]}
                          onPress={() =>
                            setDirForm((p) => ({
                              ...p,
                              imagenPreset: preset.key,
                              imagenCustomUrl: '',
                            }))
                          }
                        >
                          <Image
                            source={getPlaceImageSource(preset.key)}
                            style={styles.presetThumb}
                            resizeMode="cover"
                          />
                          <Text
                            style={[
                              styles.presetLabel,
                              {
                                color: selected
                                  ? C.primaryLight
                                  : C.textSecondary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {preset.labelEs}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
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
  presetsRow: {
    gap: 8,
    paddingVertical: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pinDotsText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 6,
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
